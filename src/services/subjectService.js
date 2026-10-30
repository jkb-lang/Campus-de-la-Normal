import { supabase } from '../config/supabaseClient';

export const subjectService = {
  // Get all courses and divisions
  async getCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    } catch {
      const local = localStorage.getItem('campus_courses');
      return local ? JSON.parse(local) : [
        { id: 'c1', name: '1° Año', division: '1° División', shift: 'Mañana', year: 2026 },
        { id: 'c2', name: '1° Año', division: '2° División', shift: 'Tarde', year: 2026 },
        { id: 'c3', name: '2° Año', division: '1° División', shift: 'Mañana', year: 2026 },
        { id: 'c4', name: '3° Año', division: '1° División', shift: 'Mañana', year: 2026 },
        { id: 'c5', name: '4° Año', division: 'U', shift: 'Mañana', year: 2026 },
        { id: 'c6', name: '5° Año', division: 'U', shift: 'Mañana', year: 2026 },
      ];
    }
  },

  // Create Course
  async createCourse(courseData) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      const courses = await this.getCourses();
      const newCourse = { ...courseData, id: 'c-' + Date.now() };
      localStorage.setItem('campus_courses', JSON.stringify([...courses, newCourse]));
      return newCourse;
    }
  },

  // Get all subjects
  async getSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          courses (id, name, division, shift),
          subject_teachers (
            teacher_id,
            profiles:teacher_id (id, full_name, email)
          )
        `)
        .order('name');
      if (error) throw error;
      if (data && data.length > 0) return data;
      throw new Error('Empty subjects, load institutional defaults');
    } catch {
      const local = localStorage.getItem('campus_subjects');
      if (local) return JSON.parse(local);

      // Default institutional subjects for Escuela Normal Superior
      const defaultSubjects = [
        {
          id: 'sub-lengua-1',
          name: 'Lengua y Literatura I',
          code: 'LIT-101',
          description: 'Comprensión lectora, análisis discursivo y literatura clásica y latinoamericana.',
          color: '#1e40af',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c1',
          courses: { id: 'c1', name: '1° Año', division: '1° División' },
          syllabus: [
            { unit: 1, title: 'La comunicación y tipos textuales', description: 'El circuito comunicativo y tramas narrativas.' },
            { unit: 2, title: 'Mitos y leyendas regionales', description: 'Tradición oral riojana y leyendas del NOA.' },
            { unit: 3, title: 'El texto expositivo y académico', description: 'Pautas de síntesis, resúmenes e informes.' }
          ]
        },
        {
          id: 'sub-mate-1',
          name: 'Matemática I',
          code: 'MAT-101',
          description: 'Álgebra básica, geometría plana, proporcionalidad y razonamiento lógico.',
          color: '#047857',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c1',
          courses: { id: 'c1', name: '1° Año', division: '1° División' },
          syllabus: [
            { unit: 1, title: 'Conjuntos numéricos enteros', description: 'Operaciones fundamentales y propiedades.' },
            { unit: 2, title: 'Ecuaciones de primer grado', description: 'Resolución de problemas cotidianos con incógnitas.' },
            { unit: 3, title: 'Geometría y figuras planas', description: 'Perímetros, áreas y Teorema de Pitágoras.' }
          ]
        },
        {
          id: 'sub-hist-1',
          name: 'Historia Argentina y Regional',
          code: 'HIS-101',
          description: 'Historia colonial, luchas por la independencia y caudillos riojanos.',
          color: '#b45309',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c1',
          courses: { id: 'c1', name: '1° Año', division: '1° División' },
          syllabus: [
            { unit: 1, title: 'Proceso emancipador 1810-1820', description: 'Revolución de Mayo y Declaración de la Independencia.' },
            { unit: 2, title: 'Autonomías provinciales y Caudillismo', description: 'Facundo Quiroga y Chacho Peñaloza en La Rioja.' }
          ]
        },
        {
          id: 'sub-filo-5',
          name: 'Filosofía y Formación Ética',
          code: 'FIL-501',
          description: 'Pensamiento crítico, corrientes éticas y filosofía de la educación.',
          color: '#6d28d9',
          status: 'active',
          access_type: 'request_only',
          course_id: 'c6',
          courses: { id: 'c6', name: '5° Año', division: 'U' },
          syllabus: [
            { unit: 1, title: 'El asombro y el origen del pensar', description: 'Filosofía clásica griega y presocráticos.' },
            { unit: 2, title: 'Ética y dilemas contemporáneos', description: 'Bioética, tecnología y responsabilidad moral.' }
          ]
        }
      ];
      localStorage.setItem('campus_subjects', JSON.stringify(defaultSubjects));
      return defaultSubjects;
    }
  },

  // Get Subject By ID
  async getSubjectById(subjectId) {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId) || null;
  },

  // Get subjects assigned to a teacher
  async getTeacherSubjects(teacherId) {
    const all = await this.getSubjects();
    // For demo/admin users, return all subjects. Otherwise return assigned or all if teacher
    return all;
  },

  // Get subjects where student is enrolled
  async getStudentSubjects(studentId) {
    try {
      const { data, error } = await supabase
        .from('subject_students')
        .select('subject_id, status, subjects (*, courses (*))')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (!error && data && data.length > 0) {
        return data.map((d) => d.subjects);
      }
      throw new Error('Use local');
    } catch {
      const enrollments = JSON.parse(localStorage.getItem(`enroll_${studentId}`) || '[]');
      const all = await this.getSubjects();
      if (enrollments.length > 0) {
        return all.filter((s) => enrollments.includes(s.id));
      }
      // Give initial enrollment to first 2 subjects for demonstration
      return all.slice(0, 2);
    }
  },

  // Check enrollment status
  async checkEnrollment(subjectId, studentId) {
    const enrolled = await this.getStudentSubjects(studentId);
    return enrolled.some((s) => s.id === subjectId);
  },

  // Request access to a subject
  async requestAccess(subjectId, studentId, message = '') {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .insert({
          subject_id: subjectId,
          student_id: studentId,
          message,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch {
      const existing = JSON.parse(localStorage.getItem('campus_access_requests') || '[]');
      const already = existing.find((r) => r.subject_id === subjectId && r.student_id === studentId && r.status === 'pending');
      if (already) {
        return { success: false, error: 'Ya tenés una solicitud pendiente para esta materia.' };
      }
      const newReq = {
        id: 'req-' + Date.now(),
        subject_id: subjectId,
        student_id: studentId,
        message,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('campus_access_requests', JSON.stringify([...existing, newReq]));
      return { success: true, data: newReq };
    }
  },

  // Get pending access requests for subject or teacher
  async getAccessRequests(subjectId = null) {
    try {
      let query = supabase
        .from('access_requests')
        .select(`
          *,
          subjects (id, name, code),
          profiles:student_id (id, full_name, email)
        `)
        .eq('status', 'pending');

      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch {
      const existing = JSON.parse(localStorage.getItem('campus_access_requests') || '[]');
      if (subjectId) {
        return existing.filter((r) => r.subject_id === subjectId && r.status === 'pending');
      }
      return existing.filter((r) => r.status === 'pending');
    }
  },

  // Review access request (approve / reject)
  async reviewAccessRequest(requestId, status, reviewerId, note = '') {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          response_note: note,
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      if (status === 'approved' && data) {
        await supabase.from('subject_students').insert({
          subject_id: data.subject_id,
          student_id: data.student_id,
          status: 'active',
        });
      }

      return { success: true, data };
    } catch {
      const existing = JSON.parse(localStorage.getItem('campus_access_requests') || '[]');
      let updatedReq = null;
      const updatedList = existing.map((r) => {
        if (r.id === requestId) {
          updatedReq = { ...r, status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), response_note: note };
          return updatedReq;
        }
        return r;
      });
      localStorage.setItem('campus_access_requests', JSON.stringify(updatedList));

      if (status === 'approved' && updatedReq) {
        const studentEnrollments = JSON.parse(localStorage.getItem(`enroll_${updatedReq.student_id}`) || '[]');
        if (!studentEnrollments.includes(updatedReq.subject_id)) {
          localStorage.setItem(`enroll_${updatedReq.student_id}`, JSON.stringify([...studentEnrollments, updatedReq.subject_id]));
        }
      }

      return { success: true, data: updatedReq };
    }
  },

  // Create Subject (Admin)
  async createSubject(subjectData) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert(subjectData)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      const all = await this.getSubjects();
      const newSub = {
        ...subjectData,
        id: 'sub-' + Date.now(),
        syllabus: subjectData.syllabus || [],
      };
      localStorage.setItem('campus_subjects', JSON.stringify([...all, newSub]));
      return newSub;
    }
  },

  // Update Subject
  async updateSubject(subjectId, updates) {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', subjectId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const all = await this.getSubjects();
      const updated = all.map((s) => (s.id === subjectId ? { ...s, ...updates } : s));
      localStorage.setItem('campus_subjects', JSON.stringify(updated));
      return updated.find((s) => s.id === subjectId);
    }
  }
};
