import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { activityService } from '../../services/activityService';

export const ActivityEditorModal = ({
  isOpen,
  onClose,
  subjectId,
  teacherId,
  availableMaterials = [],
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    submission_type: 'both',
    due_date: '',
    max_score: 10.0,
    status: 'published',
  });
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await activityService.createActivity(subjectId, teacherId, formData, selectedMaterialIds);
      onSaved();
      onClose();
      setFormData({
        title: '',
        description: '',
        submission_type: 'both',
        due_date: '',
        max_score: 10.0,
        status: 'published',
      });
      setSelectedMaterialIds([]);
    } catch (err) {
      console.error('Error creating activity:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Actividad Educativa"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Título de la Actividad *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="Ej: Trabajo Práctico N° 1: Análisis de Textos Regionales"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Consigna y Pautas de Realización *</label>
          <textarea
            required
            className="form-textarea"
            rows="5"
            placeholder="Escribí de manera detallada las consignas, preguntas o criterios de evaluación para tus alumnos..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Modalidad de Entrega</label>
            <select
              className="form-select"
              value={formData.submission_type}
              onChange={(e) => setFormData({ ...formData, submission_type: e.target.value })}
            >
              <option value="both">Texto en pantalla y/o Archivo adjunto</option>
              <option value="file">Únicamente Archivo (PDF, DOCX, etc.)</option>
              <option value="text">Únicamente Respuesta en texto</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fecha Límite de Entrega</label>
            <input
              type="datetime-local"
              className="form-input"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Publicando...' : 'Publicar Actividad'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
