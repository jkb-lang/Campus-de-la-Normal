import { supabase } from '../config/supabaseClient';

export const classService = {
  // Get classes for a subject
  async getClasses(subjectId, isStudent = false) {
    try {
      let query = supabase
        .from('classes')
        .select(`
          *,
          class_materials (
            material_id,
            materials (*)
          )
        `)
        .eq('subject_id', subjectId)
        .order('class_date', { ascending: false });

      if (isStudent) {
        query = query.eq('status', 'published');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch {
      const local = JSON.parse(localStorage.getItem(`classes_${subjectId}`) || '[]');
      if (isStudent) {
        return local.filter((c) => c.status === 'published');
      }
      return local;
    }
  },

  // Create new class
  async createClass(subjectId, teacherId, classData, selectedMaterialIds = []) {
    const newRecord = {
      subject_id: subjectId,
      teacher_id: teacherId,
      class_date: classData.class_date || new Date().toISOString().split('T')[0],
      title: classData.title,
      unit_topic: classData.unit_topic || '',
      content: classData.content || '',
      status: classData.status || 'published',
      tasks_homework: classData.tasks_homework || '',
      due_date: classData.due_date || null,
    };

    try {
      const { data: createdClass, error } = await supabase
        .from('classes')
        .insert(newRecord)
        .select()
        .single();
      if (error) throw error;

      // Link selected materials
      if (selectedMaterialIds && selectedMaterialIds.length > 0) {
        const links = selectedMaterialIds.map((matId) => ({
          class_id: createdClass.id,
          material_id: matId,
        }));
        await supabase.from('class_materials').insert(links);
      }

      return createdClass;
    } catch {
      const classes = await this.getClasses(subjectId, false);
      const fakeClass = {
        ...newRecord,
        id: 'cls-' + Date.now(),
        created_at: new Date().toISOString(),
        material_ids: selectedMaterialIds,
      };
      localStorage.setItem(`classes_${subjectId}`, JSON.stringify([fakeClass, ...classes]));
      return fakeClass;
    }
  },

  // Update Class
  async updateClass(subjectId, classId, updates, materialIds = null) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', classId)
        .select()
        .single();
      if (error) throw error;

      if (materialIds !== null) {
        await supabase.from('class_materials').delete().eq('class_id', classId);
        if (materialIds.length > 0) {
          const links = materialIds.map((matId) => ({
            class_id: classId,
            material_id: matId,
          }));
          await supabase.from('class_materials').insert(links);
        }
      }

      return data;
    } catch {
      const classes = await this.getClasses(subjectId, false);
      const updated = classes.map((c) =>
        c.id === classId
          ? { ...c, ...updates, material_ids: materialIds !== null ? materialIds : c.material_ids }
          : c
      );
      localStorage.setItem(`classes_${subjectId}`, JSON.stringify(updated));
      return updated.find((c) => c.id === classId);
    }
  },

  // Delete Class
  async deleteClass(subjectId, classId) {
    try {
      await supabase.from('classes').delete().eq('id', classId);
    } catch {
      const classes = await this.getClasses(subjectId, false);
      const filtered = classes.filter((c) => c.id !== classId);
      localStorage.setItem(`classes_${subjectId}`, JSON.stringify(filtered));
    }
    return true;
  }
};
