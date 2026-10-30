import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { activityService } from '../../services/activityService';
import { useNotifications } from '../../context/NotificationContext';
import { FileText, Download, CheckCircle, Clock, RotateCcw } from 'lucide-react';

export const SubmissionsReviewModal = ({
  isOpen,
  onClose,
  activity,
  teacherId,
}) => {
  const { showToast, sendNotification } = useNotifications();
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activity && isOpen) {
      loadSubmissions();
    }
  }, [activity, isOpen]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await activityService.getActivitySubmissions(activity.id);
      setSubmissions(data);
      if (data.length > 0) {
        selectSubmission(data[0]);
      } else {
        setSelectedSub(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectSubmission = (sub) => {
    setSelectedSub(sub);
    setScore(sub.score !== null && sub.score !== undefined ? sub.score.toString() : '');
    setFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (status = 'graded') => {
    if (!selectedSub) return;
    setSaving(true);
    try {
      await activityService.gradeSubmission(selectedSub.id, activity.id, teacherId, {
        score: score ? parseFloat(score) : null,
        feedback,
        status,
      });

      // Notify the student!
      await sendNotification(
        selectedSub.student_id,
        `Devolución: ${activity.title}`,
        status === 'resubmission_requested'
          ? `El profesor solicitó una corrección en tu entrega de "${activity.title}".`
          : `Tu entrega de "${activity.title}" fue corregida (Calificación: ${score || 'Completado'}).`,
        `/estudiante/actividades`,
        'grade'
      );

      showToast('Calificación y comentarios guardados exitosamente.', 'success');
      await loadSubmissions();
    } catch (err) {
      showToast('Error al guardar corrección.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!activity) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Corrección de Entregas: ${activity.title}`}
      maxWidth="820px"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', minHeight: '380px' }}>
        {/* Left: Students Submissions List */}
        <div style={{ borderRight: '1px solid var(--border-light)', paddingRight: '1rem', overflowY: 'auto' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Entregas Recibidas ({submissions.length})
          </div>

          {loading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cargando entregas...</div>
          ) : submissions.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem 0' }}>
              Aún no se registraron entregas de alumnos para esta actividad.
            </div>
          ) : (
            submissions.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => selectSubmission(sub)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                    border: isSelected ? '1px solid var(--primary-500)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '0.4rem',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {sub.profiles?.full_name || 'Estudiante'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                    <span className={`badge ${sub.status === 'graded' ? 'badge-success' : sub.status === 'resubmission_requested' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                      {sub.status === 'graded' ? 'Corregido' : sub.status === 'resubmission_requested' ? 'Rehacer' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Submission Details & Grading form */}
        <div>
          {!selectedSub ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Seleccioná un estudiante de la lista para revisar su entrega.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary-900)' }}>
                    Entrega de {selectedSub.profiles?.full_name || 'Estudiante'}
                  </h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Enviado el {new Date(selectedSub.submitted_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Text submission */}
              {selectedSub.content_text && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Respuesta del Estudiante:
                  </div>
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-light)',
                  }}>
                    {selectedSub.content_text}
                  </div>
                </div>
              )}

              {/* File submission */}
              {selectedSub.file_url && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    Archivo Adjunto:
                  </div>
                  <a
                    href={selectedSub.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Download size={14} /> Descargar {selectedSub.file_name || 'Documento de entrega'}
                  </a>
                </div>
              )}

              {/* Grading Input */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Calificación / Nota</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      className="form-input"
                      placeholder="Ej: 8.5"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Devolución y Observaciones Pedagógicas</label>
                    <textarea
                      className="form-textarea"
                      rows="3"
                      placeholder="Comentarios formativos, aspectos a mejorar o felicitaciones..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleSaveGrade('resubmission_requested')}
                    className="btn btn-secondary"
                    disabled={saving}
                  >
                    <RotateCcw size={16} /> Solicitar Nueva Entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveGrade('graded')}
                    className="btn btn-success"
                    disabled={saving}
                  >
                    <CheckCircle size={16} /> Guardar Corrección
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
