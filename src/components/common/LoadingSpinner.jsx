import React from 'react';

export const LoadingSpinner = ({ text = 'Cargando contenido...' }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    gap: '1rem',
  }}>
    <div style={{
      width: '42px',
      height: '42px',
      border: '3px solid var(--primary-100)',
      borderTopColor: 'var(--primary-800)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
      {text}
    </span>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);
