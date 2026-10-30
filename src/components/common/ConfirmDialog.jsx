import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`btn btn-${confirmVariant}`}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          padding: '0.6rem',
          borderRadius: '50%',
          backgroundColor: confirmVariant === 'danger' ? 'var(--danger-50)' : 'var(--amber-100)',
          color: confirmVariant === 'danger' ? 'var(--danger-600)' : 'var(--amber-600)',
          flexShrink: 0,
        }}>
          <AlertTriangle size={24} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
};
