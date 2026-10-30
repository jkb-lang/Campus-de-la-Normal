import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Bell, 
  Search, 
  LogOut, 
  User as UserIcon, 
  Shield, 
  BookOpen, 
  GraduationCap, 
  Menu,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { SearchModal } from './SearchModal';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, profile, role, isAdmin, isTeacher, isStudent, signOut, switchDevRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleBadge = () => {
    if (isAdmin) return <span className="badge badge-danger"><Shield size={12} /> Admin</span>;
    if (isTeacher) return <span className="badge badge-primary"><BookOpen size={12} /> Profesor</span>;
    return <span className="badge badge-success"><GraduationCap size={12} /> Estudiante</span>;
  };

  return (
    <>
      <header className="header-nav">
        {/* Left: Mobile trigger & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.4rem' }}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          <Link to="/panel" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: '38px',
              height: '38px',
              backgroundColor: 'var(--primary-800)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(30, 58, 138, 0.3)',
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary-900)', lineHeight: 1.1 }}>
                Campus: <span style={{ color: 'var(--primary-700)' }}>La Normal</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Aprender mejor, juntos.
              </div>
            </div>
          </Link>
        </div>

        {/* Center/Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Quick Global Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-pill)', padding: '0.45rem 0.9rem' }}
          >
            <Search size={16} />
            <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>Buscar...</span>
          </button>

          {/* Dev Role Quick Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-muted)', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 0.3rem', fontWeight: 600 }}>ROL:</span>
            <button
              onClick={() => switchDevRole('student')}
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                backgroundColor: role === 'student' ? 'var(--success-600)' : 'transparent',
                color: role === 'student' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Estudiante
            </button>
            <button
              onClick={() => switchDevRole('teacher')}
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                backgroundColor: role === 'teacher' ? 'var(--primary-800)' : 'transparent',
                color: role === 'teacher' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Profesor
            </button>
            <button
              onClick={() => switchDevRole('admin')}
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.5rem',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                backgroundColor: role === 'admin' ? 'var(--danger-600)' : 'transparent',
                color: role === 'admin' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              Admin
            </button>
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'relative', padding: '0.5rem', borderRadius: '50%' }}
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: 'var(--danger-500)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-surface)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '340px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)',
                zIndex: 60,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                    Notificaciones
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', color: 'var(--primary-600)' }}
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No tenés notificaciones pendientes.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) navigate(n.link);
                          setShowNotifications(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-light)',
                          backgroundColor: n.is_read ? 'transparent' : 'var(--primary-50)',
                          cursor: 'pointer',
                          transition: 'background-color var(--trans-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-900)' }}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.6rem' }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}>
                {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ textAlign: 'left', display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {profile?.full_name || 'Usuario'}
                </div>
                {getRoleBadge()}
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '220px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)',
                zIndex: 60,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                    {profile?.full_name || 'Mi Perfil'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.email || user?.email}
                  </div>
                  <div style={{ marginTop: '0.4rem' }}>{getRoleBadge()}</div>
                </div>

                <div style={{ padding: '0.4rem' }}>
                  <Link
                    to="/perfil"
                    onClick={() => setShowUserMenu(false)}
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
                  >
                    <UserIcon size={16} /> Mi Perfil y Cuenta
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
                    >
                      <Shield size={16} /> Panel Administrador
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', color: 'var(--danger-600)' }}
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};
