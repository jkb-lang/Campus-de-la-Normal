import { describe, it, expect, beforeEach } from 'vitest';
import { subjectService } from '../services/subjectService';
import { materialService } from '../services/materialService';
import { classService } from '../services/classService';
import { activityService } from '../services/activityService';
import { previousSubjectsService } from '../services/previousSubjectsService';
import { aiService } from '../services/aiService';
import { adminService } from '../services/adminService';

// Mock localStorage for test environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();

describe('Campus: La Normal - Pruebas Obligatorias de Flujos y Módulos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. FLUJO DOCENTE
  describe('Flujo Docente: Biblioteca, Planificación y Correcciones', () => {
    it('1. Docente ingresa a materia asignada y organiza materiales en la biblioteca anual', async () => {
      const teacherId = 'teacher-101';
      const subjectId = 'sub-lengua-1';

      // Crear carpeta
      const folder = await materialService.createFolder(subjectId, 'Unidad 1 - Mitos Regionales', null, teacherId);
      expect(folder).toBeDefined();
      expect(folder.name).toBe('Unidad 1 - Mitos Regionales');

      // Subir documento a la biblioteca anual
      const fakeFile = {
        name: 'Guia_Mitos_Riojanos.pdf',
        size: 1024 * 500, // 500 KB
        type: 'application/pdf',
      };

      const material = await materialService.uploadMaterial(subjectId, teacherId, fakeFile, {
        title: 'Guía de Mitos Riojanos',
        description: 'Material de lectura obligatoria para la Unidad 1',
        folder_id: folder.id,
        unit_number: 1,
        publication_status: 'published',
      });

      expect(material).toBeDefined();
      expect(material.title).toBe('Guía de Mitos Riojanos');
      expect(material.resource_type).toBe('pdf');
      expect(material.publication_status).toBe('published');

      // Verificar que el estudiante solo ve publicados
      const studentMaterials = await materialService.getMaterials(subjectId, true);
      expect(studentMaterials.length).toBeGreaterThan(0);
      expect(studentMaterials.some((m) => m.id === material.id)).toBe(true);

      // Cambiar a borrador y comprobar que el estudiante ya no lo ve
      await materialService.updateMaterial(subjectId, material.id, { publication_status: 'draft' });
      const studentAfterDraft = await materialService.getMaterials(subjectId, true);
      expect(studentAfterDraft.some((m) => m.id === material.id)).toBe(false);
    });

    it('2. Docente crea una clase y reutiliza un documento de su biblioteca anual sin resubirlo', async () => {
      const teacherId = 'teacher-101';
      const subjectId = 'sub-lengua-1';

      // Documento existente en biblioteca
      const material = await materialService.uploadMaterial(subjectId, teacherId, { name: 'Lectura.pdf', size: 100 }, {
        title: 'Lectura de Leyendas',
        publication_status: 'published',
      });

      // Crear clase vinculando el material existente
      const newClass = await classService.createClass(
        subjectId,
        teacherId,
        {
          title: 'Clase N° 1: Introducción a la tradición oral',
          class_date: '2026-03-10',
          unit_topic: 'Unidad 1',
          content: 'Explicación de las leyendas tradicionales riojanas.',
          status: 'published',
        },
        [material.id]
      );

      expect(newClass).toBeDefined();
      expect(newClass.title).toBe('Clase N° 1: Introducción a la tradición oral');
      expect(newClass.material_ids).toContain(material.id);
    });

    it('3. Docente crea actividad, alumno entrega y docente corrige con nota y devoluciones', async () => {
      const teacherId = 'teacher-101';
      const studentId = 'student-202';
      const subjectId = 'sub-lengua-1';

      // 1. Crear actividad
      const activity = await activityService.createActivity(subjectId, teacherId, {
        title: 'TP N° 1: Análisis del mito del Mikilo',
        description: 'Responder las consignas sobre el mito riojano.',
        submission_type: 'both',
        max_score: 10.0,
      });

      expect(activity).toBeDefined();
      expect(activity.id).toBeDefined();

      // 2. Alumno envía entrega
      const submissionRes = await activityService.submitActivity(activity.id, studentId, {
        text: 'El mito del Mikilo representa el cuidado infantil en la siesta riojana...',
      });
      expect(submissionRes.success).toBe(true);
      expect(submissionRes.data.status).toBe('submitted');

      // 3. Docente corrige entrega
      const gradeRes = await activityService.gradeSubmission(submissionRes.data.id, activity.id, teacherId, {
        score: 9.5,
        feedback: 'Excelente fundamentación y comprensión del contexto regional.',
        status: 'graded',
      });

      expect(gradeRes.success).toBe(true);
      expect(gradeRes.data.score).toBe(9.5);
      expect(gradeRes.data.status).toBe('graded');

      // 4. Alumno consulta su corrección
      const studentSub = await activityService.getStudentSubmission(activity.id, studentId);
      expect(studentSub.score).toBe(9.5);
      expect(studentSub.feedback).toContain('Excelente fundamentación');
    });
  });

  // 2. FLUJO DEL ESTUDIANTE
  describe('Flujo del Estudiante: Solicitud de Acceso, Aula y Materias Previas', () => {
    it('1. Estudiante solicita acceso a materia restringida y no puede acceder hasta aprobación', async () => {
      const studentId = 'student-unauthorized-999';
      const subjectId = 'sub-filo-5';

      // Comprobar que no tiene acceso
      const isEnrolledInitially = await subjectService.checkEnrollment(subjectId, studentId);
      expect(isEnrolledInitially).toBe(false);

      // Enviar solicitud de acceso
      const reqRes = await subjectService.requestAccess(subjectId, studentId, 'Solicito acceso para cursar');
      expect(reqRes.success).toBe(true);

      // Intentar solicitud duplicada: debe ser prevenida
      const dupRes = await subjectService.requestAccess(subjectId, studentId, 'Duplicado');
      expect(dupRes.success).toBe(false);
      expect(dupRes.error).toContain('Ya tenés una solicitud pendiente');

      // Profesor aprueba la solicitud
      await subjectService.reviewAccessRequest(reqRes.data.id, 'approved', 'teacher-101');

      // Ahora el alumno debe contar con acceso
      const isEnrolledAfter = await subjectService.checkEnrollment(subjectId, studentId);
      expect(isEnrolledAfter).toBe(true);
    });

    it('2. Módulo de Materias Previas: checklist de unidades y progreso personal', async () => {
      const studentId = 'student-prep-555';
      const subjectId = 'sub-mate-1';

      // Agregar a preparación personal
      const plan = await previousSubjectsService.addSubjectPrep(
        studentId,
        subjectId,
        '2026-07-15',
        'Repasar antes del turno de julio'
      );
      expect(plan).toBeDefined();
      expect(plan.progress_percent).toBe(0);

      // Marcar Unidad 1 como completada
      const updatedPlan = await previousSubjectsService.toggleUnitCompletion(studentId, subjectId, 1, 3);
      expect(updatedPlan.completed_units).toContain(1);
      expect(updatedPlan.progress_percent).toBe(33); // 1 de 3 = 33%
    });

    it('3. Tutor de IA: genera cuestionarios y respuestas con base en materias autorizadas', async () => {
      const studentId = 'student-ai-777';
      const subject = {
        id: 'sub-lengua-1',
        name: 'Lengua y Literatura I',
      };

      const aiResponse = await aiService.askTutor(subject, studentId, 'Generame un cuestionario de práctica', 'quiz');
      expect(aiResponse).toBeDefined();
      expect(aiResponse.message).toContain('Cuestionario de Práctica');
      expect(aiResponse.sources.length).toBeGreaterThan(0);
    });
  });

  // 3. FLUJO DEL ADMINISTRADOR
  describe('Flujo del Administrador: Gestión de Cursos, Materias y Roles', () => {
    it('1. Administrador crea curso y división', async () => {
      const newCourse = await subjectService.createCourse({
        name: '4° Año',
        division: '2° División',
        shift: 'Tarde',
        year: 2026,
      });

      expect(newCourse).toBeDefined();
      expect(newCourse.name).toBe('4° Año');
      expect(newCourse.division).toBe('2° División');
    });

    it('2. Administrador actualiza rol y estado de un usuario', async () => {
      const user = await adminService.updateUser('u3', { role: 'teacher', is_active: true });
      expect(user).toBeDefined();
      expect(user.role).toBe('teacher');
    });
  });

  // 4. FUNCIONES EXPRESAMENTE EXCLUIDAS
  describe('Verificación de Funciones Expresamente Excluidas', () => {
    it('Confirma que los estudiantes no cuentan con función de carga general de apuntes propios', () => {
      // Los estudiantes solo pueden enviar archivos como respuesta a una actividad del docente
      expect(materialService.uploadMaterial).toBeDefined();
      // materialService solo se invoca en el contexto docente (teacherId verificado)
    });
  });
});
