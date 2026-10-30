import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  Calendar, 
  FolderCheck, 
  CheckCircle, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const LandingPage = () => {
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  // Modals state
  const [authModal, setAuthModal] = useState(null); // 'login', 'register', 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect to panel
  React.useEffect(() => {
    if (user) {
      navigate('/panel');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await signIn(formData.email, formData.password);
    setLoading(false);

    if (res.success) {
      showToast('¡Bienvenido a Campus: La Normal!', 'success');
      navigate('/panel');
    } else {
      setErrorMsg(res.error || 'Credenciales incorrectas.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await signUp(formData.email, formData.password, formData.fullName, formData.role);
    setLoading(false);

    if (res.success) {
      showToast('Cuenta creada con éxito. Ya podés acceder a tu espacio.', 'success');
      setAuthModal('login');
    } else {
      setErrorMsg(res.error || 'No se pudo crear la cuenta.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await resetPassword(formData.email);
    setLoading(false);
    if (res.success) {
      showToast('Si la cuenta existe, recibirás las instrucciones en tu correo.', 'info');
      setAuthModal(null);
    } else {
      setErrorMsg(res.error || 'Error al solicitar recuperación.');
    }
  };

  const handleQuickDemo = async (roleType) => {
    const demoAccounts = {
      teacher: { email: 'profesor@lanormal.edu.ar', pass: 'docente123' },
      student: { email: 'estudiante@lanormal.edu.ar', pass: 'alumno123' },
      admin: { email: 'admin@lanormal.edu.ar', pass: 'admin123' },
    };

    const target = demoAccounts[roleType];
    setLoading(true);
    const res = await signIn(target.email, target.pass);
    setLoading(false);
    if (res.success) {
      showToast(`Acceso directo como ${roleType.toUpperCase()}`, 'success');
      navigate('/panel');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      {/* Public Header */}
      <header style={{
        height: '70px',
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--primary-800)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-900)' }}>
              Campus: <span style={{ color: 'var(--primary-700)' }}>La Normal</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Escuela Normal Superior de La Rioja
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => { setAuthModal('login'); setErrorMsg(''); }}
            className="btn btn-secondary"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setAuthModal('register'); setErrorMsg(''); }}
            className="btn btn-primary"
          >
            Crear Cuenta
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '4.5rem 1.5rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.9rem',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-800)',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            <Sparkles size={16} /> Plataforma Educativa Oficial 2026
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
            color: 'var(--primary-900)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1rem',
          }}>
            Aprender mejor, <span style={{ color: 'var(--primary-700)' }}>juntos.</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            maxWidth: '680px',
            marginInline: 'auto',
          }}>
            Espacio integral de enseñanza y aprendizaje para estudiantes y docentes de la Escuela Normal Superior de La Rioja. Clases diarias, materiales organizados, actividades pedagógicas y tutor inteligente.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setAuthModal('login')}
              className="btn btn-primary btn-lg"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              Ingresar al Campus <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setAuthModal('register')}
              className="btn btn-secondary btn-lg"
            >
              Registrarse como Alumno
            </button>
          </div>

          {/* Direct Demonstration Access Box */}
          <div style={{
            marginTop: '3rem',
            padding: '1.25rem 1.75rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            display: 'inline-block',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '0.6rem' }}>
              Acceso Rápido de Prueba (Entorno de Desarrollo):
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => handleQuickDemo('student')} className="btn btn-secondary btn-sm">
                <UserCheck size={14} color="var(--success-600)" /> Rol Estudiante
              </button>
              <button onClick={() => handleQuickDemo('teacher')} className="btn btn-secondary btn-sm">
                <BookOpen size={14} color="var(--primary-600)" /> Rol Profesor
              </button>
              <button onClick={() => handleQuickDemo('admin')} className="btn btn-secondary btn-sm">
                <ShieldCheck size={14} color="var(--danger-600)" /> Rol Administrador
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
            Herramientas Educativas Diseñadas para la Comunidad Normal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Todo lo necesario para acompañar la trayectoria académica durante todo el ciclo lectivo.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-800)', marginBottom: '1rem' }}>
              <FolderCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Biblioteca Anual Docente</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Los profesores organizan sus materiales en carpetas y temas para todo el año. Reutilización ágil de documentos sin duplicación innecesaria.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-800)', marginBottom: '1rem' }}>
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Clases y Planificación</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Registro de clases diarias con consignas, contenidos vinculados y cronogramas claros para docentes y estudiantes.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-800)', marginBottom: '1rem' }}>
              <CheckCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Actividades y Entregas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Entorno estructurado para el envío de respuestas pedagógicas, devoluciones formativas y seguimiento de correcciones individuales.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-800)', marginBottom: '1rem' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Tutor Inteligente de IA</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Asistente pedagógico que explica temas y genera cuestionarios de práctica basándose exclusivamente en los documentos autorizados de la materia.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-800)', marginBottom: '1rem' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Materias Previas y Pendientes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Módulo específico para organizar el estudio personal de espacios adeudados con programas verificados y seguimiento por unidades.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-800)', marginBottom: '1rem' }}>
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Privacidad y Permisos Reales</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Seguridad respaldada en PostgreSQL con verificación estricta de roles, protección de entregas y acceso controlado a documentos.
            </p>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-surface)',
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
      }}>
        <div style={{ fontWeight: 700, color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
          Escuela Normal Superior de La Rioja
        </div>
        <div>
          Campus: La Normal • “Aprender mejor, juntos.” • Ciclo Lectivo 2026
        </div>
      </footer>

      {/* AUTH MODALS */}
      {/* 1. Login Modal */}
      <Modal
        isOpen={authModal === 'login'}
        onClose={() => setAuthModal(null)}
        title="Iniciar Sesión en el Campus"
      >
        <form onSubmit={handleLoginSubmit}>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          <div className="form-group">
            <label className="form-label">Correo Electrónico Institucional</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="ejemplo@lanormal.edu.ar"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              name="password"
              required
              className="form-input"
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setAuthModal('forgot'); setErrorMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-600)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
            <button
              type="button"
              onClick={() => { setAuthModal('register'); setErrorMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-800)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Crear cuenta nueva
            </button>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar al Campus'}
          </button>
        </form>
      </Modal>

      {/* 2. Register Modal */}
      <Modal
        isOpen={authModal === 'register'}
        onClose={() => setAuthModal(null)}
        title="Crear Cuenta en Campus: La Normal"
      >
        <form onSubmit={handleRegisterSubmit}>
          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          <div className="form-group">
            <label className="form-label">Nombre y Apellido Completo</label>
            <input
              type="text"
              name="fullName"
              required
              className="form-input"
              placeholder="Ej: Lucía Ramos"
              value={formData.fullName}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="tu_correo@ejemplo.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña (Mínimo 6 caracteres)</label>
            <input
              type="password"
              name="password"
              required
              className="form-input"
              placeholder="Contraseña segura"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol Deseado</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleInputChange}
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor / Docente</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Nota: Las cuentas de profesor y materias son verificadas institucionalmente.
            </span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Confirmar Registro'}
          </button>
        </form>
      </Modal>

      {/* 3. Forgot Password Modal */}
      <Modal
        isOpen={authModal === 'forgot'}
        onClose={() => setAuthModal(null)}
        title="Recuperar Contraseña"
      >
        <form onSubmit={handleForgotSubmit}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ingresá tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer tu clave.
          </p>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="tu_correo@ejemplo.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Instrucciones'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
