import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderArchive,
  Calendar,
  CheckSquare,
  Sparkles,
  BookmarkCheck,
  Users,
  Settings,
  X,
  GraduationCap
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, isAdmin, isTeacher, isStudent } = useAuth();

  const teacherLinks = [
    { to: '/panel', label: 'Panel Docente', icon: LayoutDashboard },
    { to: '/profesor/materias', label: 'Mis Materias', icon: BookOpen },
    { to: '/profesor/biblioteca', label: 'Biblioteca Anual', icon: FolderArchive },
    { to: '/profesor/clases', label: 'Clases y Planificación', icon: Calendar },
    { to: '/profesor/actividades', label: 'Actividades y Entregas', icon: CheckSquare },
    { to: '/materias-previas', label: 'Materias Previas', icon: BookmarkCheck },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
    { to: '/tutor-ia', label: 'Tutor de IA', icon: Sparkles },
  ];

  const studentLinks = [
    { to: '/panel', label: 'Mi Espacio', icon: LayoutDashboard },
    { to: '/estudiante/materias', label: 'Mis Materias', icon: BookOpen },
    { to: '/estudiante/biblioteca', label: 'Biblioteca de Materiales', icon: FolderArchive },
    { to: '/estudiante/actividades', label: 'Actividades y Tareas', icon: CheckSquare },
    { to: '/materias-previas', label: 'Materias Previas', icon: BookmarkCheck },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
    { to: '/tutor-ia', label: 'Tutor de IA', icon: Sparkles },
  ];

  const adminLinks = [
    { to: '/panel', label: 'Panel de Control', icon: LayoutDashboard },
    { to: '/admin/usuarios', label: 'Gestión de Usuarios', icon: Users },
    { to: '/admin/materias', label: 'Materias y Cursos', icon: BookOpen },
    { to: '/admin/solicitudes', label: 'Solicitudes de Acceso', icon: CheckSquare },
    { to: '/materias-previas', label: 'Materias Previas', icon: BookmarkCheck },
    { to: '/calendario', label: 'Calendario Escolar', icon: Calendar },
    { to: '/tutor-ia', label: 'Tutor de IA', icon: Sparkles },
  ];

  const links = isAdmin ? adminLinks : isTeacher ? teacherLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 45,
            display: 'block',
          }}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          transition: 'transform var(--trans-base)',
          transform: isOpen ? 'translateX(0)' : undefined,
          flexShrink: 0,
        }}
      >
        {/* Top Header inside Sidebar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GraduationCap size={22} color="var(--primary-800)" />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-900)' }}>
              Campus: La Normal
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 0.75rem 0.5rem',
          }}>
            Navegación {isAdmin ? 'Administrativa' : isTeacher ? 'Docente' : 'Estudiantil'}
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.875rem',
                      color: isActive ? 'var(--primary-800)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all var(--trans-fast)',
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-muted)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Escuela Normal Superior
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            La Rioja, Argentina • Ciclo 2026
          </div>
        </div>
      </aside>
    </>
  );
};
