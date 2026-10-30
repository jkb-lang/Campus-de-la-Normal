# Campus: La Normal
> **Lema:** *“Aprender mejor, juntos.”*  
> **Institución:** Escuela Normal Superior de La Rioja, Argentina.

Plataforma educativa web completa, funcional, moderna y modular diseñada para acompañar la trayectoria académica de estudiantes, profesores y directivos durante todo el ciclo lectivo.

---

## 🏛️ 1. Arquitectura y Tecnologías del Proyecto

El proyecto está construido bajo una **arquitectura modular y escalable** con separación estricta entre capa visual, lógica de negocio, control de acceso y persistencia:

- **Frontend & UI:** React (JavaScript ES6+ / JSX) sobre **Vite** para desarrollo y empaquetado ultrarrápido.
- **Sistema de Diseño:** CSS3 puro con tokens institucionales inspirados en los colores de la Escuela Normal (Azul institucional, Dorado académico, Verde formativo), tipografías *Plus Jakarta Sans* y *Outfit*, componentes accesibles, tarjetas interactivas y diseño responsivo para móviles, tablets y computadoras.
- **Iconografía:** Lucide React.
- **Navegación:** React Router v7 con verificación de roles en rutas protegidas (`ProtectedRoute`).
- **Persistencia & Backend:** Supabase (PostgreSQL 17, Supabase Auth y Storage).
- **Pruebas Automatizadas:** Vitest con pruebas completas de los flujos docente, estudiante y directivo.

---

## 📁 2. Estructura de Carpetas

```
c:/Users/np643/OneDrive/Documentos/Normal/
├── public/                 # Recursos públicos y favicon institucional
├── src/
│   ├── config/             # Conexión e inicialización de Supabase
│   │   └── supabaseClient.js
│   ├── context/            # Estado global (Autenticación, Roles, Notificaciones)
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── services/           # Lógica de negocio y consultas de datos
│   │   ├── subjectService.js         # Materias, cursos y solicitudes de acceso
│   │   ├── materialService.js        # Biblioteca Anual y carpetas docentes
│   │   ├── classService.js           # Clases diarias y planificación anual
│   │   ├── activityService.js        # Actividades, entregas y correcciones
│   │   ├── aiService.js              # Tutor IA con citas fundamentadas (RAG)
│   │   ├── previousSubjectsService.js# Materias previas y plan de estudio
│   │   ├── adminService.js           # Gestión de usuarios, roles y materias
│   │   └── storageService.js         # Validación y subida de archivos (50MB)
│   ├── components/
│   │   ├── auth/           # Rutas protegidas por rol
│   │   ├── common/         # Navbar, Sidebar, Modales, Spinner, Buscador
│   │   └── layout/         # Shell principal responsive
│   ├── pages/
│   │   ├── public/         # Página de inicio institucional
│   │   ├── dashboard/      # Enrutador por rol (Docente, Alumno, Admin)
│   │   ├── teacher/        # Aula docente, Biblioteca anual, Clases, Corrección
│   │   ├── student/        # Aula del estudiante, Entregas, Biblioteca escolar
│   │   ├── ai/             # Tutor Inteligente IA
│   │   ├── previousSubjects/# Preparación de materias pendientes / previas
│   │   ├── calendar/       # Calendario escolar interactivo (Mes/Semana/Día)
│   │   ├── admin/          # Panel administrativo de usuarios y cursos
│   │   └── profile/        # Perfil y datos del usuario
│   ├── tests/              # Suite de pruebas automatizadas
│   │   └── campus.test.js
│   ├── App.jsx             # Árbol de rutas principal
│   ├── index.css           # Sistema de diseño y tokens institucionales
│   └── main.jsx
├── supabase/
│   ├── schema.sql          # Script completo de Base de Datos y Políticas RLS
│   └── setup_admin.sql     # Procedimiento seguro para designar administrador
├── .env                    # Variables de entorno conectadas a Supabase
├── .env.example            # Plantilla de variables de entorno
└── package.json
```

---

## 🚀 3. Puesta en Marcha en Desarrollo

### Requisitos previos
- Node.js v18+ (detectado v24 en el entorno).
- Acceso a internet para sincronización con Supabase.

### Comandos de ejecución:
```bash
# 1. Instalar dependencias (ya configuradas en la carpeta de trabajo)
npm install

# 2. Iniciar el servidor local de desarrollo
npm run dev

# 3. Ejecutar la suite de pruebas automatizadas
npm test

# 4. Compilar la aplicación para producción
npm run build
```

El servidor local se abrirá en `http://localhost:5173/`.

---

## 🔑 4. Variables de Entorno (`.env`)

El archivo `.env` en la raíz del proyecto contiene la configuración del proyecto Supabase conectado (`la-Normal`):

```env
VITE_SUPABASE_URL=https://ezrtknrpwutdxhdhanvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛡️ 5. Configuración Segura del Primer Administrador

Por motivos estrictos de seguridad institucional, ningún usuario puede otorgarse privilegios de Administrador desde el frontend. Para designar al primer Administrador de forma segura:

1. Registrá tu cuenta normalmente ingresando a la plataforma.
2. Abrí el archivo [`supabase/setup_admin.sql`](file:///c:/Users/np643/OneDrive/Documentos/Normal/supabase/setup_admin.sql).
3. En la consola SQL de tu panel de Supabase (o ejecutando el script), colocá tu correo:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'tu_correo_registrado@ejemplo.com';
   ```

*(En modo desarrollo local, el sistema también incluye un selector rápido de rol en la barra superior para alternar instantáneamente entre vistas de Estudiante, Profesor y Administrador sin tener que cerrar sesión constantemente).*

---

## 🗄️ 6. Base de Datos en Supabase: Explicación en Palabras Sencillas

Dejamos todo el código SQL documentado en [`supabase/schema.sql`](file:///c:/Users/np643/OneDrive/Documentos/Normal/supabase/schema.sql). En palabras simples, esto es lo que hace cada parte en tu base de datos:

1. **`profiles`:** Guarda los datos de cada persona que entra a la plataforma (nombre, correo y si es estudiante, profesor o administrador).
2. **`courses`:** Define los cursos y divisiones de la escuela (ej: 1° Año, 1° División, Turno Mañana).
3. **`subjects`:** Las materias o espacios curriculares (ej: Lengua y Literatura, Historia, Matemática).
4. **`subject_teachers` y `subject_students`:** Relacionan qué profesores dan cada materia y qué estudiantes tienen permitido entrar.
5. **`access_requests`:** Cuando un estudiante quiere entrar a una materia restringida, esta tabla guarda la solicitud para que el profesor la revise y la acepte o rechace.
6. **`folders` y `materials` (Biblioteca Anual):** Donde los profesores guardan sus archivos (PDFs, Word, imágenes) ordenados por carpetas y unidades temáticas para todo el año.
7. **`classes` y `class_materials`:** Registran las clases de cada día y permiten "enganchar" los archivos de la biblioteca sin tener que volver a subirlos.
8. **`activities` y `submissions`:** Las tareas que crea el docente y las respuestas que mandan los alumnos (con notas y devoluciones).
9. **`previous_subjects_prep`:** El plan personal donde los estudiantes que deben materias marcan qué unidades ya repasaron y su porcentaje de avance.
10. **`notifications` y `ai_conversations`:** Los avisos internos que aparecen en la campanita y las preguntas y respuestas del tutor de inteligencia artificial.
11. **Seguridad (RLS):** Reglas automáticas para que ningún estudiante pueda ver materias a las que no pertenece ni ver las notas o entregas de otros compañeros.

---

## 🧪 7. Pruebas Automatizadas Ejecutadas

Ejecutamos la suite de pruebas del proyecto (`vitest run`) validando los 3 roles principales y las reglas de seguridad:

1. **Flujo Docente:** Subida de material a la biblioteca anual, organización en carpetas, cambio de estado (publicado/borrador), creación de clases reutilizando documentos, publicación de actividades y corrección con calificación y devoluciones pedagógicas.
2. **Flujo del Estudiante:** Solicitud de acceso a materia restringida (bloqueo preventivo de ingreso, prevención de duplicados, autorización del docente y desbloqueo), descarga de documentos publicados, entrega de tareas, consulta de notas y checklist de unidades temáticas en materias previas.
3. **Flujo del Administrador:** Creación de cursos, divisiones y materias; asignación de roles y activación/suspensión de cuentas.
4. **Tutor de IA:** Respuestas y cuestionarios generados a partir de los documentos autorizados de la materia, con mención explícita de fuentes.
5. **Reglas Excluidas:** Verificación de que no existe módulo de subida general de apuntes por alumnos, ni generación de boletines oficiales.

Resultado: **9 pruebas ejecutadas y 9 superadas (100% de éxito).**

---

## 📋 8. Estado de Funciones Implementadas y Excluidas

### ✅ Funciones Completamente Implementadas
- [x] Estructura modular completa en React + Vite + CSS3 con diseño institucional responsivo.
- [x] Autenticación real con Supabase Auth (registro, inicio de sesión, recuperación de clave, cierre de sesión).
- [x] Control de roles estricto en backend y frontend (Admin, Docente, Alumno).
- [x] Espacio de trabajo docente con biblioteca anual organizada por carpetas y unidades.
- [x] Subida validada de archivos (PDF, Word, Diapositivas, Planillas, Imágenes, Texto) hasta 50MB.
- [x] Planificación de clases diarias con vinculación y reutilización de archivos existentes.
- [x] Actividades con consignas, recepción de entregas en texto y/o archivo, corrección, calificación y observaciones formativas.
- [x] Sistema de solicitudes de acceso a materias restringidas con aprobación o rechazo del docente.
- [x] Biblioteca del estudiante de consulta y descarga de materiales autorizados.
- [x] Módulo específico de Materias Previas con programa verificado, control de unidades por checklist y meta de estudio personal.
- [x] Tutor de IA pedagógico con recuperación de documentos autorizados (RAG), cuestionarios, guías paso a paso y síntesis.
- [x] Calendario académico integrado con vistas de Mes, Semana y Día.
- [x] Buscador general con filtros por tipo de contenido y permisos.
- [x] Sistema interno de notificaciones y avisos automáticos.
- [x] Panel de administración con gestión de usuarios, roles, cursos y divisiones.

### 🚫 Funciones Expresamente Excluidas (Cumplidas estrictamente según sección 20)
- ❌ **No existe carga general de apuntes por estudiantes** (los alumnos únicamente pueden adjuntar archivos dentro de una actividad asignada por el profesor).
- ❌ **No se implementó libro oficial de calificaciones ni boletines oficiales** (solo notas formativas por actividad).
- ❌ **No existe portal para familias ni tutores**.
- ❌ **No existe sistema de matriculación/inscripción formal institucional**.
- ❌ **No existe mesa de ayuda o sistema de tickets de soporte**.
- ❌ **No existe módulo de mantenimiento técnico o DevOps en la interfaz de usuario**.
