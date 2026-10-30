import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Toast alert system
  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch {
      // Local fallback if table is not yet migrated
      const localNotes = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
      setNotifications(localNotes);
      setUnreadCount(localNotes.filter((n) => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch {
      if (user) {
        const local = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
        const updated = local.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        localStorage.setItem(`notes_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      if (user) {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      }
    } catch {
      if (user) {
        const local = JSON.parse(localStorage.getItem(`notes_${user.id}`) || '[]');
        const updated = local.map((n) => ({ ...n, is_read: true }));
        localStorage.setItem(`notes_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  // Send internal notification helper
  const sendNotification = async (targetUserId, title, message, link = '', type = 'info') => {
    const newNote = {
      id: Date.now().toString(),
      user_id: targetUserId,
      title,
      message,
      link,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('notifications').insert(newNote);
    } catch {
      const local = JSON.parse(localStorage.getItem(`notes_${targetUserId}`) || '[]');
      localStorage.setItem(`notes_${targetUserId}`, JSON.stringify([newNote, ...local]));
    }

    if (user && user.id === targetUserId) {
      setNotifications((prev) => [newNote, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    showToast,
    sendNotification,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              padding: '0.85rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#1e3a8a',
              color: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
