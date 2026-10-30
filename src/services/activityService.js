import { supabase } from '../config/supabaseClient';
import { storageService } from './storageService';

export const activityService = {
  // Get activities for a subject
  async getActivities(subjectId, isStudent = false) {
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          activity_materials (
            material_id,
            materials (*)
          )
        `)
        .eq('subject_id', subjectId)
        .order('publish_date', { ascending: false });

      if (isStudent) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`activities_${subjectId}`) || '[]');
      if (isStudent) {
        return local.filter((a) => a.status === 'published');
      }
      return local;
    }
  },

  // Create Activity
  async createActivity(subjectId, teacherId, activityData, selectedMaterialIds = []) {
    const newRecord = {
      subject_id: subjectId,
      teacher_id: teacherId,
      title: activityData.title,
      description: activityData.description,
      submission_type: activityData.submission_type || 'both',
      due_date: activityData.due_date || null,
      publish_date: new Date().toISOString(),
      status: activityData.status || 'published',
      max_score: activityData.max_score || 10.0,
    };

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert(newRecord)
        .select()
        .single();
      if (error) throw error;

      if (selectedMaterialIds.length > 0) {
        const links = selectedMaterialIds.map((matId) => ({
          activity_id: data.id,
          material_id: matId,
        }));
        await supabase.from('activity_materials').insert(links);
      }

      return data;
    } catch {
      const activities = await this.getActivities(subjectId, false);
      const fakeActivity = {
        ...newRecord,
        id: 'act-' + Date.now(),
        created_at: new Date().toISOString(),
        material_ids: selectedMaterialIds,
      };
      localStorage.setItem(`activities_${subjectId}`, JSON.stringify([fakeActivity, ...activities]));
      return fakeActivity;
    }
  },

  // Student submits response (text and/or file)
  async submitActivity(activityId, studentId, { text = '', file = null }) {
    let fileUrl = null;
    let filePath = null;
    let fileName = null;

    if (file) {
      const storagePath = `submissions/${activityId}/${studentId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const uploadRes = await storageService.uploadFile('student-submissions', storagePath, file);
      fileUrl = uploadRes.url;
      filePath = uploadRes.path;
      fileName = uploadRes.name;
    }

    const submissionRecord = {
      activity_id: activityId,
      student_id: studentId,
      content_text: text,
      file_url: fileUrl,
      file_path: filePath,
      file_name: fileName,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    };

    try {
      const { data, error } = await supabase
        .from('submissions')
        .upsert(submissionRecord, { onConflict: 'activity_id,student_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch {
      const all = JSON.parse(localStorage.getItem(`submissions_${activityId}`) || '[]');
      const filtered = all.filter((s) => s.student_id !== studentId);
      const newSub = {
        ...submissionRecord,
        id: 'subm-' + Date.now(),
      };
      localStorage.setItem(`submissions_${activityId}`, JSON.stringify([...filtered, newSub]));
      return { success: true, data: newSub };
    }
  },

  // Get student's submission for an activity
  async getStudentSubmission(activityId, studentId) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('activity_id', activityId)
        .eq('student_id', studentId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch {
      const all = JSON.parse(localStorage.getItem(`submissions_${activityId}`) || '[]');
      return all.find((s) => s.student_id === studentId) || null;
    }
  },

  // Get all submissions for an activity (Teacher view)
  async getActivitySubmissions(activityId) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles:student_id (id, full_name, email)
        `)
        .eq('activity_id', activityId)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      const all = JSON.parse(localStorage.getItem(`submissions_${activityId}`) || '[]');
      return all;
    }
  },

  // Teacher grades a submission and leaves feedback
  async gradeSubmission(submissionId, activityId, teacherId, { score, feedback, status = 'graded' }) {
    const updateData = {
      score: parseFloat(score),
      feedback,
      status, // 'graded' or 'resubmission_requested'
      graded_by: teacherId,
      graded_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch {
      const all = JSON.parse(localStorage.getItem(`submissions_${activityId}`) || '[]');
      let updated = null;
      const newList = all.map((s) => {
        if (s.id === submissionId) {
          updated = { ...s, ...updateData };
          return updated;
        }
        return s;
      });
      localStorage.setItem(`submissions_${activityId}`, JSON.stringify(newList));
      return { success: true, data: updated };
    }
  }
};
