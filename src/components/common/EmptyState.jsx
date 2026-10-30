import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No hay elementos registrados',
  description = 'Actualmente no se registran datos para mostrar en esta sección.',
  actionLabel = null,
  onAction = null,
}) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <Icon size={28} />
    </div>
    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.4rem', color: 'var(--primary-900)' }}>
      {title}
    </h3>
    <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
      {description}
    </p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn btn-primary btn-sm">
        {actionLabel}
      </button>
    )}
  </div>
);
