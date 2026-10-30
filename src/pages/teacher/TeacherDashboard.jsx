import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { 
  BookOpen, 
  FolderArchive, 
  Calendar, 
  CheckSquare, 
  Plus, 
  Users, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [subs, reqs] = await Promise.all([
          subjectService.getTeacherSubjects(user?.id),
          subjectService.getAccessRequests(),
        ]);
        setSubjects(subs);
        setPendingRequests(reqs);
      } catch (err) {
        console.error('Teacher dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) return <LoadingSpinner text="Cargando tu panel docente..." />;

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        padding: '2rem 2.25rem',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        color: '#ffffff',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700, marginBottom: '0.25rem' }}>
            Panel de Gestión Docente • Escuela Normal Superior
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '1.85rem', marginBottom: '0.5rem' }}>
            Hola, {profile?.full_name || 'Profesor/a'}
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', maxWidth: '600px' }}>
            Planificá tus clases, organizá tus documentos en la biblioteca anual y hacé seguimiento de las entregas de tus alumnos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/profesor/biblioteca')}
            className="btn"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', backdropFilter: 'blur(4px)' }}
          >
            <FolderArchive size={16} /> Biblioteca Anual
          </button>
          <button
            onClick={() => navigate('/profesor/clases')}
            className="btn btn-accent"
          >
            <Calendar size={16} /> Planificar Clase
          </button>
        </div>
      </div>

      {/* Pending Access Requests Alert */}
      {pendingRequests.length > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={18} />
            <span>
              Tenés <strong>{pendingRequests.length} solicitud(es) de acceso de alumnos</strong> pendientes de revisión.
            </span>
          </div>
          <button
            onClick={() => navigate('/admin/solicitudes')}
            className="btn btn-secondary btn-sm"
          >
            Revisar Solicitudes
          </button>
        </div>
      )}

      {/* Subjects Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Espacios Curriculares Asignados</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Seleccioná una materia para gestionar su biblioteca, clases diarias y actividades.
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No tenés materias asignadas aún"
            description="Contactate con la administración académica para asociar tus espacios curriculares del ciclo 2026."
          />
        ) : (
          <div className="grid-cards">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${sub.color || 'var(--primary-800)'}`,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary">
                      {sub.courses?.name || '1° Año'} - {sub.courses?.division || '1° Div'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {sub.code || 'S/C'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
                    {sub.name}
                  </h3>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1rem' }}>
                    {sub.description || 'Espacio curricular oficial de la institución.'}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    {sub.syllabus?.length || 0} unidades temáticas definidas
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <Link
                    to={`/profesor/materia/${sub.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Abrir Aula <ArrowRight size={14} />
                  </Link>
                  <Link
                    to={`/tutor-ia?subject=${sub.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Herramientas IA sobre esta materia"
                  >
                    <Sparkles size={14} color="var(--primary-600)" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick shortcuts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-800)' }}>
            <FolderArchive size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Biblioteca Anual</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Archivos organizados por carpetas y unidades</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--amber-100)', color: 'var(--amber-600)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Clases y Planificación</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Clases diarias, tareas y fechas límite</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Actividades y Entregas</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Correcciones, notas y retroalimentación</div>
          </div>
        </div>
      </div>
    </div>
  );
};
