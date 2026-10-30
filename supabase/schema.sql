-- ==============================================================================
-- CAMPUS: LA NORMAL - "Aprender mejor, juntos."
-- Escuela Normal Superior de La Rioja, Argentina
-- Script de Base de Datos PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: PROFILES (Perfiles de usuarios vinculados a Auth)
-- Almacena los datos personales y el rol educativo (admin, teacher, student).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. TABLA: COURSES (Cursos y Divisiones institucionales)
-- Ej: "1° Año - 1° División - Turno Mañana"
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,            -- Ej: '1° Año', '2° Año', etc.
  division TEXT NOT NULL,        -- Ej: '1° División', '2° División', 'A'
  shift TEXT DEFAULT 'Mañana',   -- 'Mañana', 'Tarde', 'Noche'
  year INT DEFAULT 2026,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TABLA: SUBJECTS (Materias / Espacios curriculares)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,            -- Ej: 'Lengua y Literatura', 'Historia'
  code TEXT UNIQUE,              -- Código de materia ej: 'LIT-101'
  description TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  access_type TEXT CHECK (access_type IN ('open', 'request_only', 'invite_only')) DEFAULT 'request_only',
  color TEXT DEFAULT '#1e3a8a',  -- Color institucional identificador
  syllabus JSONB DEFAULT '[]'::jsonb, -- Unidades y temas oficiales
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. TABLA: SUBJECT_TEACHERS (Asignación de docentes a materias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, teacher_id)
);

-- ==============================================================================
-- 6. TABLA: SUBJECT_STUDENTS (Matriculaciones autorizadas de alumnos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subject_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, student_id)
);

-- ==============================================================================
-- 7. TABLA: ACCESS_REQUESTS (Solicitudes de acceso de estudiantes)
-- Permite que un alumno solicite ingreso a una materia y el docente apruebe o rechace.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  message TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  response_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. TABLA: FOLDERS (Estructura de carpetas de la biblioteca docente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. TABLA: MATERIALS (Biblioteca Anual de Documentos y Recursos Docentes)
-- Almacena documentos subidos por el profesor (PDF, Word, Diapositivas, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  unit_number INT,
  unit_title TEXT,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'doc', 'slides', 'sheet', 'text', 'image', 'video', 'other')) DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  version INT DEFAULT 1,
  publication_status TEXT CHECK (publication_status IN ('draft', 'published', 'hidden', 'archived')) DEFAULT 'published',
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. TABLA: CLASSES (Clases diarias y planificación docente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  class_date DATE NOT NULL,
  title TEXT NOT NULL,
  unit_topic TEXT,
  content TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  tasks_homework TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. TABLA: CLASS_MATERIALS (Reutilización de archivos en clases)
-- Permite vincular materiales de la biblioteca a una clase sin resubirlos.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.class_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  UNIQUE(class_id, material_id)
);

-- ==============================================================================
-- 12. TABLA: ACTIVITIES (Actividades educativas creadas por el docente)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  submission_type TEXT CHECK (submission_type IN ('text', 'file', 'both')) DEFAULT 'both',
  due_date TIMESTAMPTZ,
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('draft', 'published', 'closed')) DEFAULT 'published',
  max_score NUMERIC(5,2) DEFAULT 10.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. TABLA: ACTIVITY_MATERIALS (Archivos adjuntos a una consigna)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  UNIQUE(activity_id, material_id)
);

-- ==============================================================================
-- 14. TABLA: SUBMISSIONS (Entregas y correcciones de alumnos)
-- Protegidas: solo visibles para el alumno autor y el profesor del espacio.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_text TEXT,
  file_url TEXT,
  file_path TEXT,
  file_name TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('submitted', 'graded', 'resubmission_requested')) DEFAULT 'submitted',
  score NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  UNIQUE(activity_id, student_id)
);

-- ==============================================================================
-- 15. TABLA: PREVIOUS_SUBJECTS_PREP (Módulo de Materias Previas)
-- Permite al estudiante organizar su preparación personal de materias adeudadas.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.previous_subjects_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  target_exam_date DATE,
  notes TEXT,
  progress_percent INT DEFAULT 0,
  completed_units JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ==============================================================================
-- 16. TABLA: NOTIFICATIONS (Sistema interno de avisos y novedades)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 17. TABLA: AI_CONVERSATIONS (Interacciones del Tutor de IA por materia)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 18. FUNCIONES Y DISPARADORES DE SEGURIDAD
-- ==============================================================================

-- Disparador automático al registrarse un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funciones de verificación de rol y permisos en servidor
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_teacher_of(sub_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.subject_teachers st
    WHERE st.subject_id = sub_id AND st.teacher_id = auth.uid()
  ) OR public.is_admin();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_enrolled_in(sub_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.subject_students ss
    WHERE ss.subject_id = sub_id AND ss.student_id = auth.uid() AND ss.status = 'active'
  ) OR public.is_teacher_of(sub_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 19. ACTIVACIÓN DE SEGURIDAD A NIVEL DE FILA (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.previous_subjects_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles viewable by authenticated users') THEN
    CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access on profiles') THEN
    CREATE POLICY "Admins full access on profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Courses viewable by all authenticated') THEN
    CREATE POLICY "Courses viewable by all authenticated" ON public.courses FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage courses') THEN
    CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Subjects viewable by authenticated') THEN
    CREATE POLICY "Subjects viewable by authenticated" ON public.subjects FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers and admin manage subjects') THEN
    CREATE POLICY "Teachers and admin manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_teacher_of(id) OR public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Subject teachers viewable by authenticated') THEN
    CREATE POLICY "Subject teachers viewable by authenticated" ON public.subject_teachers FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage subject teachers') THEN
    CREATE POLICY "Admins manage subject teachers" ON public.subject_teachers FOR ALL TO authenticated USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Subject students viewable') THEN
    CREATE POLICY "Subject students viewable" ON public.subject_students FOR SELECT TO authenticated 
      USING (student_id = auth.uid() OR public.is_teacher_of(subject_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manage subject students') THEN
    CREATE POLICY "Manage subject students" ON public.subject_students FOR ALL TO authenticated 
      USING (public.is_teacher_of(subject_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students see own access requests') THEN
    CREATE POLICY "Students see own access requests" ON public.access_requests FOR SELECT TO authenticated 
      USING (student_id = auth.uid() OR public.is_teacher_of(subject_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students insert own access requests') THEN
    CREATE POLICY "Students insert own access requests" ON public.access_requests FOR INSERT TO authenticated 
      WITH CHECK (student_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers update access requests') THEN
    CREATE POLICY "Teachers update access requests" ON public.access_requests FOR UPDATE TO authenticated 
      USING (public.is_teacher_of(subject_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Folders viewable') THEN
    CREATE POLICY "Folders viewable" ON public.folders FOR SELECT TO authenticated 
      USING (public.is_enrolled_in(subject_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Folders manage') THEN
    CREATE POLICY "Folders manage" ON public.folders FOR ALL TO authenticated 
      USING (public.is_teacher_of(subject_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Materials viewable') THEN
    CREATE POLICY "Materials viewable" ON public.materials FOR SELECT TO authenticated 
      USING (
        (public.is_enrolled_in(subject_id) AND publication_status = 'published') 
        OR public.is_teacher_of(subject_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Materials manage') THEN
    CREATE POLICY "Materials manage" ON public.materials FOR ALL TO authenticated 
      USING (public.is_teacher_of(subject_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Classes viewable') THEN
    CREATE POLICY "Classes viewable" ON public.classes FOR SELECT TO authenticated 
      USING (
        (public.is_enrolled_in(subject_id) AND status = 'published') 
        OR public.is_teacher_of(subject_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Classes manage') THEN
    CREATE POLICY "Classes manage" ON public.classes FOR ALL TO authenticated 
      USING (public.is_teacher_of(subject_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Class materials viewable') THEN
    CREATE POLICY "Class materials viewable" ON public.class_materials FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Class materials manage') THEN
    CREATE POLICY "Class materials manage" ON public.class_materials FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Activities viewable') THEN
    CREATE POLICY "Activities viewable" ON public.activities FOR SELECT TO authenticated 
      USING (
        (public.is_enrolled_in(subject_id) AND status = 'published') 
        OR public.is_teacher_of(subject_id)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Activities manage') THEN
    CREATE POLICY "Activities manage" ON public.activities FOR ALL TO authenticated 
      USING (public.is_teacher_of(subject_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Activity materials viewable') THEN
    CREATE POLICY "Activity materials viewable" ON public.activity_materials FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Activity materials manage') THEN
    CREATE POLICY "Activity materials manage" ON public.activity_materials FOR ALL TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Submissions viewable') THEN
    CREATE POLICY "Submissions viewable" ON public.submissions FOR SELECT TO authenticated 
      USING (
        student_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.activities a WHERE a.id = submissions.activity_id AND public.is_teacher_of(a.subject_id))
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students insert own submission') THEN
    CREATE POLICY "Students insert own submission" ON public.submissions FOR INSERT TO authenticated 
      WITH CHECK (student_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students and teachers update submissions') THEN
    CREATE POLICY "Students and teachers update submissions" ON public.submissions FOR UPDATE TO authenticated 
      USING (
        student_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.activities a WHERE a.id = submissions.activity_id AND public.is_teacher_of(a.subject_id))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Previous subjects prep student access') THEN
    CREATE POLICY "Previous subjects prep student access" ON public.previous_subjects_prep FOR ALL TO authenticated 
      USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own notifications') THEN
    CREATE POLICY "Users see own notifications" ON public.notifications FOR ALL TO authenticated 
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'AI conversations student access') THEN
    CREATE POLICY "AI conversations student access" ON public.ai_conversations FOR ALL TO authenticated 
      USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
  END IF;
END $$;
