import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { User, Shield, Key, Mail, CheckCircle, Save } from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useNotifications();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      full_name: fullName.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
    });
    setSaving(false);
    if (res.success) {
      showToast('Perfil actualizado correctamente.', 'success');
    } else {
      showToast(res.error || 'Error al actualizar perfil.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
          Mi Perfil y Configuración
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Información personal y datos de tu cuenta institucional en Campus: La Normal.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-100)',
            color: 'var(--primary-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 800,
          }}>
            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--primary-900)', margin: '0 0 0.2rem' }}>
              {profile?.full_name || 'Usuario'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-danger' : profile?.role === 'teacher' ? 'badge-primary' : 'badge-success'}`}>
                {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'teacher' ? 'Profesor / Docente' : 'Estudiante'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user?.email}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Nombre y Apellido</label>
            <input
              type="text"
              required
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Institucional (No modificable)</label>
            <input
              type="email"
              disabled
              className="form-input"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
              value={user?.email || profile?.email || ''}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono de Contacto (Opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="+54 380 4..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Biografía o Presentación Breve</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Presentación para tu comunidad académica..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
