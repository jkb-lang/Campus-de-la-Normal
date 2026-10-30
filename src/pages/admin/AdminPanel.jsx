import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { adminService } from '../../services/adminService';
import { subjectService } from '../../services/subjectService';
import { 
  Shield, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Check, 
  X, 
  UserCheck, 
  UserX,
  AlertTriangle,
  FolderCheck
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';

export const AdminPanel = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'subjects', 'courses'
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Course Modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: '', division: '', shift: 'Mañana', year: 2026 });

  // New Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
    course_id: '',
    access_type: 'request_only',
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [uList, sList, cList] = await Promise.all([
        adminService.getUsers(),
        subjectService.getSubjects(),
        subjectService.getCourses(),
      ]);
      setUsers(uList);
      setSubjects(sList);
      setCourses(cList);
    } catch (err) {
      console.error(err);
      showToast('Error cargando panel de administración.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      showToast(`Rol actualizado a ${newRole.toUpperCase()}.`, 'success');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch {
      showToast('Error al modificar rol.', 'error');
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await adminService.updateUser(userId, { is_active: !currentStatus });
      showToast(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}.`, 'info');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u)));
    } catch {
      showToast('Error al modificar estado.', 'error');
    }
  };

  // Submit Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await subjectService.createCourse(courseForm);
      showToast('Curso y división creados con éxito.', 'success');
      setShowCourseModal(false);
      setCourseForm({ name: '', division: '', shift: 'Mañana', year: 2026 });
      const cList = await subjectService.getCourses();
      setCourses(cList);
    } catch {
      showToast('Error al crear curso.', 'error');
    }
  };

  // Submit Subject
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await subjectService.createSubject({
        ...subjectForm,
        color: '#1e40af',
        syllabus: [
          { unit: 1, title: 'Unidad Inicial: Fundamentos', description: 'Introducción al programa anual.' }
        ]
      });
      showToast('Materia creada con éxito.', 'success');
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '', description: '', course_id: '', access_type: 'request_only' });
      const sList = await subjectService.getSubjects();
      setSubjects(sList);
    } catch {
      showToast('Error al crear materia.', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Cargando panel de administración..." />;

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <Shield size={24} color="var(--danger-600)" />
          <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', margin: 0 }}>
            Panel de Administración Institucional
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Gestión de usuarios, roles educativos, materias, cursos y divisiones de la Escuela Normal Superior.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Usuarios Registrados ({users.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <BookOpen size={18} /> Materias y Espacios ({subjects.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <GraduationCap size={18} /> Cursos y Divisiones ({courses.length})
        </button>
      </div>

      {/* TAB 1: USUARIOS */}
      {activeTab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Usuario</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Rol Autorizado</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.full_name || 'Sin nombre'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <select
                      className="form-select"
                      style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                      value={u.role || 'student'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="student">Estudiante</option>
                      <option value="teacher">Profesor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                      className="btn btn-secondary btn-sm"
                    >
                      {u.is_active !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                      {u.is_active !== false ? 'Suspender' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MATERIAS */}
      {activeTab === 'subjects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary">
              <Plus size={16} /> Crear Materia
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Materia</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Código</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Curso y División</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Modalidad</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.description}</div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>{s.code || 'S/C'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>{s.courses?.name || '1° Año'} - {s.courses?.division || '1° Div'}</td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span className="badge badge-primary">{s.access_type || 'request_only'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CURSOS */}
      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowCourseModal(true)} className="btn btn-primary">
              <Plus size={16} /> Crear Curso / División
            </button>
          </div>

          <div className="grid-cards">
            {courses.map((c) => (
              <div key={c.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{c.shift || 'Mañana'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ciclo {c.year || 2026}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
                  {c.name}
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {c.division}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Course */}
      <Modal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        title="Crear Curso y División"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateCourse}>
          <div className="form-group">
            <label className="form-label">Nombre del Año / Nivel *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ej: 1° Año, 2° Año..."
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">División *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ej: 1° División, 2° División, U"
              value={courseForm.division}
              onChange={(e) => setCourseForm({ ...courseForm, division: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Turno</label>
            <select
              className="form-select"
              value={courseForm.shift}
              onChange={(e) => setCourseForm({ ...courseForm, shift: e.target.value })}
            >
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowCourseModal(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear Curso</button>
          </div>
        </form>
      </Modal>

      {/* Modal: New Subject */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="Crear Nuevo Espacio Curricular"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label">Nombre de la Materia *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Ej: Geografía Regional"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Código</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: GEO-101"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Curso Asignado</label>
              <select
                className="form-select"
                value={subjectForm.course_id}
                onChange={(e) => setSubjectForm({ ...subjectForm, course_id: e.target.value })}
              >
                <option value="">(Seleccionar curso)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.division}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Resumen del enfoque curricular..."
              value={subjectForm.description}
              onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowSubjectModal(false)} className="btn btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar Materia</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
