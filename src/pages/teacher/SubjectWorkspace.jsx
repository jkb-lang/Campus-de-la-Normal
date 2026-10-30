import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { subjectService } from '../../services/subjectService';
import { materialService } from '../../services/materialService';
import { classService } from '../../services/classService';
import { activityService } from '../../services/activityService';
import { 
  BookOpen, 
  FolderArchive, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  Upload, 
  Plus, 
  FolderPlus, 
  Eye, 
  Download, 
  Trash2, 
  Edit3, 
  Clock, 
  Check, 
  X, 
  Users, 
  Search,
  FileText
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { MaterialUploadModal } from './MaterialUploadModal';
import { ClassEditorModal } from './ClassEditorModal';
import { ActivityEditorModal } from './ActivityEditorModal';
import { SubmissionsReviewModal } from './SubmissionsReviewModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const SubjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast, sendNotification } = useNotifications();

  const [subject, setSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('library'); // 'library', 'classes', 'activities', 'requests'
  const [loading, setLoading] = useState(true);

  // Data states
  const [materials, setMaterials] = useState([]);
  const [folders, setFolders] = useState([]);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);

  // Filter states for library
  const [searchMaterial, setSearchMaterial] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedReviewActivity, setSelectedReviewActivity] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'material' | 'class', id, title }
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const sub = await subjectService.getSubjectById(id);
      setSubject(sub);

      const [mats, flds, cls, acts, reqs] = await Promise.all([
        materialService.getMaterials(id, false),
        materialService.getFolders(id),
        classService.getClasses(id, false),
        activityService.getActivities(id, false),
        subjectService.getAccessRequests(id),
      ]);

      setMaterials(mats);
      setFolders(flds);
      setClasses(cls);
      setActivities(acts);
      setAccessRequests(reqs);
    } catch (err) {
      console.error(err);
      showToast('Error cargando los datos de la materia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  // Folder creation
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await materialService.createFolder(id, newFolderName.trim(), null, user?.id);
      setNewFolderName('');
      setShowNewFolderInput(false);
      showToast('Carpeta creada con éxito.', 'success');
      const flds = await materialService.getFolders(id);
      setFolders(flds);
    } catch (err) {
      showToast('Error al crear carpeta.', 'error');
    }
  };

  // Toggle Publication status
  const handleTogglePublication = async (mat) => {
    const nextStatus = mat.publication_status === 'published' ? 'hidden' : 'published';
    try {
      await materialService.updateMaterial(id, mat.id, { publication_status: nextStatus });
      showToast(`Material ${nextStatus === 'published' ? 'publicado' : 'ocultado'}.`, 'info');
      const mats = await materialService.getMaterials(id, false);
      setMaterials(mats);
    } catch (err) {
      showToast('Error al actualizar estado.', 'error');
    }
  };

  // Delete Action confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'material') {
        await materialService.deleteMaterial(id, deleteConfirm.id);
        showToast('Material eliminado.', 'info');
        setMaterials((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'class') {
        await classService.deleteClass(id, deleteConfirm.id);
        showToast('Clase eliminada.', 'info');
        setClasses((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
      }
    } catch {
      showToast('Error al eliminar.', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Access Request Review
  const handleReviewRequest = async (reqId, status, studentId) => {
    try {
      await subjectService.reviewAccessRequest(reqId, status, user?.id, status === 'approved' ? 'Acceso concedido por el docente.' : 'Solicitud no admitida.');
      await sendNotification(
        studentId,
        `Solicitud a ${subject?.name}`,
        status === 'approved' ? `¡Tu solicitud de acceso a ${subject?.name} fue aprobada!` : `Tu solicitud de acceso a ${subject?.name} fue rechazada.`,
        `/estudiante/materia/${id}`,
        'access'
      );
      showToast(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'}.`, 'success');
      const reqs = await subjectService.getAccessRequests(id);
      setAccessRequests(reqs);
    } catch {
      showToast('Error al responder solicitud.', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Abriendo aula docente..." />;
  if (!subject) return <EmptyState title="Materia no encontrada" description="El espacio curricular solicitado no existe o no tenés permisos de acceso." />;

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesQuery = !searchMaterial || m.title.toLowerCase().includes(searchMaterial.toLowerCase());
    const matchesUnit = selectedUnit === 'all' || m.unit_number === parseInt(selectedUnit);
    const matchesType = selectedType === 'all' || m.resource_type === selectedType;
    return matchesQuery && matchesUnit && matchesType;
  });

  return (
    <div>
      {/* Subject Header */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        borderTop: `6px solid ${subject.color || 'var(--primary-800)'}`,
        padding: '1.75rem 2rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-primary">
                {subject.courses?.name || '1° Año'} - {subject.courses?.division || '1° División'}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Código: {subject.code}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
              {subject.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.5 }}>
              {subject.description || 'Espacio curricular anual.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to={`/tutor-ia?subject=${subject.id}`} className="btn btn-secondary">
              <Sparkles size={16} color="var(--primary-600)" /> Tutor IA de la Materia
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <FolderArchive size={18} /> Biblioteca Anual ({materials.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <Calendar size={18} /> Clases y Planificación ({classes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          <CheckSquare size={18} /> Actividades y Entregas ({activities.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <Users size={18} /> Solicitudes ({accessRequests.length})
        </button>
      </div>

      {/* TAB 1: BIBLIOTECA ANUAL */}
      {activeTab === 'library' && (
        <div>
          {/* Controls bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
            backgroundColor: 'var(--bg-surface)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
          }}>
            {/* Search and filters */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar documento..."
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="all">Todas las unidades</option>
                {subject.syllabus?.map((u) => (
                  <option key={u.unit} value={u.unit}>Unidad {u.unit}</option>
                ))}
              </select>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Todos los formatos</option>
                <option value="pdf">PDF</option>
                <option value="doc">Word / Texto</option>
                <option value="slides">Diapositivas</option>
                <option value="sheet">Planillas</option>
                <option value="image">Imágenes</option>
              </select>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="btn btn-secondary"
              >
                <FolderPlus size={16} /> Nueva Carpeta
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
              >
                <Upload size={16} /> Subir Documentos
              </button>
            </div>
          </div>

          {/* New Folder Inline Form */}
          {showNewFolderInput && (
            <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Nombre de la carpeta..."
                className="form-input"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
              <button type="button" onClick={() => setShowNewFolderInput(false)} className="btn btn-secondary btn-sm">Cancelar</button>
            </form>
          )}

          {/* Materials Table / List */}
          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={FolderArchive}
              title="Biblioteca vacía"
              description="Aún no subiste documentos a esta materia. Cargá guías, lecturas o presentaciones que utilizarás durante el año."
              actionLabel="Subir Primer Documento"
              onAction={() => setShowUploadModal(true)}
            />
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Documento</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Unidad</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Tipo</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Estado</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((mat) => (
                    <tr
                      key={mat.id}
                      style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color var(--trans-fast)' }}
                    >
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--primary-50)',
                            color: 'var(--primary-800)',
                            display: 'flex',
                          }}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{mat.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {mat.file_name} • {(mat.file_size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {mat.unit_number ? (
                          <span className="badge badge-neutral">Unidad {mat.unit_number}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>General</span>
                        )}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {mat.resource_type}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <button
                          onClick={() => handleTogglePublication(mat)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            padding: 0,
                          }}
                          title="Clic para cambiar visibilidad"
                        >
                          <span className={`badge ${mat.publication_status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                            {mat.publication_status === 'published' ? 'Publicado' : 'Borrador'}
                          </span>
                        </button>
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <a
                            href={mat.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm"
                            title="Descargar o Ver"
                            style={{ padding: '0.4rem' }}
                          >
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'material', id: mat.id, title: mat.title })}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.4rem', color: 'var(--danger-600)' }}
                            title="Eliminar de la biblioteca"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASES Y PLANIFICACIÓN */}
      {activeTab === 'classes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)' }}>Planificación y Clases Diarias</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Organizá las jornadas de clase y asociá los documentos de tu biblioteca anual.
              </p>
            </div>
            <button
              onClick={() => { setEditingClass(null); setShowClassModal(true); }}
              className="btn btn-primary"
            >
              <Plus size={16} /> Planificar Nueva Clase
            </button>
          </div>

          {classes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay clases planificadas"
              description="Registrá los temas, consignas y lecturas de tus clases para que tus alumnos sigan el ritmo académico."
              actionLabel="Planificar Primera Clase"
              onAction={() => setShowClassModal(true)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {classes.map((cls) => (
                <div key={cls.id} className="card" style={{ borderLeft: '4px solid var(--primary-700)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span className="badge badge-primary">{cls.class_date}</span>
                        {cls.unit_topic && <span className="badge badge-neutral">{cls.unit_topic}</span>}
                        <span className={`badge ${cls.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                          {cls.status === 'published' ? 'Publicada' : 'Borrador'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.2rem', color: 'var(--primary-900)' }}>{cls.title}</h4>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => { setEditingClass(cls); setShowClassModal(true); }}
                        className="btn btn-secondary btn-sm"
                      >
                        <Edit3 size={14} /> Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'class', id: cls.id, title: cls.title })}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger-600)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {cls.content && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
                      {cls.content}
                    </p>
                  )}

                  {/* Attached Materials from Annual Library */}
                  {cls.class_materials && cls.class_materials.length > 0 && (
                    <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        Materiales vinculados de la biblioteca ({cls.class_materials.length}):
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {cls.class_materials.map((cm) => (
                          <a
                            key={cm.material_id}
                            href={cm.materials?.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                          >
                            <FileText size={14} /> {cm.materials?.title || 'Documento'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {cls.tasks_homework && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--amber-600)', fontWeight: 600 }}>
                      📌 Tarea: {cls.tasks_homework} {cls.due_date && `(Vence: ${cls.due_date.split('T')[0]})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVIDADES Y ENTREGAS */}
      {activeTab === 'activities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)' }}>Actividades Pedagógicas</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Consignas de trabajos prácticos, recepción de entregas y correcciones.
              </p>
            </div>
            <button
              onClick={() => setShowActivityModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Crear Actividad
            </button>
          </div>

          {activities.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No hay actividades creadas"
              description="Creá trabajos prácticos, preguntas de análisis o tareas con entrega de texto o archivo."
              actionLabel="Crear Primera Actividad"
              onAction={() => setShowActivityModal(true)}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {activities.map((act) => (
                <div key={act.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">
                        {act.submission_type === 'both' ? 'Texto y Archivo' : act.submission_type === 'file' ? 'Solo Archivo' : 'Solo Texto'}
                      </span>
                      <span className={`badge ${act.status === 'published' ? 'badge-success' : 'badge-neutral'}`}>
                        {act.status === 'published' ? 'Publicada' : 'Borrador'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                      {act.title}
                    </h4>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {act.description}
                    </p>

                    {act.due_date && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} /> Fecha límite: {new Date(act.due_date).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                    <button
                      onClick={() => setSelectedReviewActivity(act)}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      <CheckSquare size={14} /> Revisar y Corregir Entregas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SOLICITUDES DE ACCESO */}
      {activeTab === 'requests' && (
        <div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
            Solicitudes de Acceso a la Materia
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Los estudiantes matriculados en la institución que no tienen acceso automático solicitan ingreso aquí.
          </p>

          {accessRequests.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay solicitudes pendientes"
              description="Actualmente no se registran peticiones de estudiantes pendientes de autorización."
            />
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>Estudiante</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Mensaje</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Fecha</th>
                    <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Decisión</th>
                  </tr>
                </thead>
                <tbody>
                  {accessRequests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div style={{ fontWeight: 600 }}>{req.profiles?.full_name || 'Estudiante'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.profiles?.email}</div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                        {req.message || '(Sin mensaje adicional)'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleReviewRequest(req.id, 'approved', req.student_id)}
                            className="btn btn-success btn-sm"
                          >
                            <Check size={14} /> Aprobar
                          </button>
                          <button
                            onClick={() => handleReviewRequest(req.id, 'rejected', req.student_id)}
                            className="btn btn-danger btn-sm"
                          >
                            <X size={14} /> Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <MaterialUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        subjectId={id}
        teacherId={user?.id}
        folders={folders}
        units={subject.syllabus || []}
        onUploaded={() => {
          showToast('Materiales agregados a la biblioteca.', 'success');
          loadAllData();
        }}
      />

      <ClassEditorModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        subjectId={id}
        teacherId={user?.id}
        classItem={editingClass}
        availableMaterials={materials}
        onSaved={() => {
          showToast('Clase guardada exitosamente.', 'success');
          loadAllData();
        }}
      />

      <ActivityEditorModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        subjectId={id}
        teacherId={user?.id}
        availableMaterials={materials}
        onSaved={() => {
          showToast('Actividad publicada con éxito.', 'success');
          loadAllData();
        }}
      />

      <SubmissionsReviewModal
        isOpen={!!selectedReviewActivity}
        onClose={() => setSelectedReviewActivity(null)}
        activity={selectedReviewActivity}
        teacherId={user?.id}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar elemento?"
        message={`¿Estás seguro de que deseás eliminar "${deleteConfirm?.title}"?`}
      />
    </div>
  );
};
