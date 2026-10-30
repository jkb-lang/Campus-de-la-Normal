import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { activityService } from '../../services/activityService';
import { storageService } from '../../services/storageService';
import { useNotifications } from '../../context/NotificationContext';
import { Upload, FileText, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const StudentActivitySubmissionModal = ({
  isOpen,
  onClose,
  activity,
  studentId,
  onSubmitted,
}) => {
  const { showToast } = useNotifications();
  const [submission, setSubmission] = useState(null);
  const [textResponse, setTextResponse] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activity && isOpen) {
      loadExistingSubmission();
    }
  }, [activity, isOpen]);

  const loadExistingSubmission = async () => {
    setLoading(true);
    try {
      const data = await activityService.getStudentSubmission(activity.id, studentId);
      setSubmission(data);
      if (data) {
        setTextResponse(data.content_text || '');
      } else {
        setTextResponse('');
      }
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const val = storageService.validateFile(selected);
      if (!val.valid) {
        setErrorMsg(val.error);
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!textResponse.trim() && !file) {
      setErrorMsg('Debés ingresar una respuesta en texto o adjuntar un archivo.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await activityService.submitActivity(activity.id, studentId, {
        text: textResponse,
        file: file,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      showToast('¡Entrega enviada exitosamente!', 'success');
      if (onSubmitted) onSubmitted();
      await loadExistingSubmission();
    } catch (err) {
      setErrorMsg(err.message || 'Error al enviar la entrega.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activity) return null;

  const allowsText = activity.submission_type === 'text' || activity.submission_type === 'both';
  const allowsFile = activity.submission_type === 'file' || activity.submission_type === 'both';
  const isGraded = submission?.status === 'graded';
  const canResubmit = !submission || submission.status === 'resubmission_requested';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Entrega: ${activity.title}`}
      maxWidth="620px"
    >
      <div>
        {/* Consigna Box */}
        <div style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1.25rem',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-800)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Consigna del Profesor:
          </div>
          <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
            {activity.description}
          </p>
          {activity.due_date && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} /> Fecha límite: {new Date(activity.due_date).toLocaleString()}
            </div>
          )}
        </div>

        {/* Existing Submission Status / Grade */}
        {submission && (
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${isGraded ? 'var(--success-500)' : 'var(--primary-100)'}`,
            backgroundColor: isGraded ? 'var(--success-50)' : 'var(--primary-50)',
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                {isGraded ? '✅ Actividad Corregida' : submission.status === 'resubmission_requested' ? '⚠️ Se solicitó una nueva entrega' : '📋 Entrega Registrada'}
              </div>
              {submission.score !== null && submission.score !== undefined && (
                <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem' }}>
                  Nota: {submission.score} / 10
                </span>
              )}
            </div>

            {submission.feedback && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <strong>Devolución del Docente:</strong> {submission.feedback}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Entregado el: {new Date(submission.submitted_at).toLocaleString()}
            </div>
          </div>
        )}

        {/* Submission Form */}
        {canResubmit ? (
          <form onSubmit={handleSubmit}>
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            {allowsText && (
              <div className="form-group">
                <label className="form-label">Tu Respuesta / Desarrollo en Texto</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Escribí aquí tu respuesta o conclusiones..."
                  value={textResponse}
                  onChange={(e) => setTextResponse(e.target.value)}
                  required={!allowsFile}
                />
              </div>
            )}

            {allowsFile && (
              <div className="form-group">
                <label className="form-label">Adjuntar Archivo de Trabajo (PDF, Word, etc.)</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={handleFileChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Podés adjuntar tu trabajo en PDF o documento de texto. Máximo 50MB.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
                Cerrar
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enviando...' : submission ? 'Reenviar Corrección' : 'Enviar Entrega'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={onClose} className="btn btn-secondary">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
