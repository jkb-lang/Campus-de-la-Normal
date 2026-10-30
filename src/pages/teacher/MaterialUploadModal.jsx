import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { materialService } from '../../services/materialService';
import { storageService } from '../../services/storageService';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export const MaterialUploadModal = ({
  isOpen,
  onClose,
  subjectId,
  teacherId,
  folders = [],
  units = [],
  onUploaded,
}) => {
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [publicationStatus, setPublicationStatus] = useState('published');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setErrorMsg('');

    // Validate each file
    for (const file of selected) {
      const val = storageService.validateFile(file);
      if (!val.valid) {
        setErrorMsg(val.error);
        return;
      }
    }

    setFiles(selected);
    if (selected.length === 1 && !title) {
      setTitle(selected[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setErrorMsg('Por favor seleccioná al menos un archivo para subir.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setProgress(20);

    try {
      const selectedUnitObj = units.find((u) => u.unit === parseInt(unitNumber));

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const docTitle = files.length === 1 ? title : file.name.replace(/\.[^/.]+$/, '');

        await materialService.uploadMaterial(subjectId, teacherId, file, {
          title: docTitle,
          description,
          folder_id: folderId || null,
          unit_number: unitNumber ? parseInt(unitNumber) : null,
          unit_title: selectedUnitObj?.title || '',
          publication_status: publicationStatus,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      onUploaded();
      onClose();
      // Reset form
      setFiles([]);
      setTitle('');
      setDescription('');
      setFolderId('');
      setUnitNumber('');
    } catch (err) {
      setErrorMsg(err.message || 'Error durante la subida del documento.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Subir Materiales a la Biblioteca Anual"
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {/* Drag/Select Box */}
        <div style={{
          border: '2px dashed var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-muted)',
          marginBottom: '1.25rem',
          cursor: 'pointer',
        }}>
          <Upload size={32} color="var(--primary-800)" style={{ margin: '0 auto 0.75rem' }} />
          <label htmlFor="file-upload-input" style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary-800)', textDecoration: 'underline' }}>
              Hacé clic para seleccionar archivos
            </span>{' '}
            o arrastralos aquí
            <input
              id="file-upload-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Formatos admitidos: PDF, Word (DOC/DOCX), Diapositivas (PPT/PPTX), Excel (XLS/XLSX), Texto e Imágenes. Máx 50MB.
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '1rem', textAlign: 'left', backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                {files.length} archivo(s) seleccionado(s):
              </div>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <FileText size={14} /> {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title for single file */}
        {files.length <= 1 && (
          <div className="form-group">
            <label className="form-label">Título del Documento</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Guía de Lectura N° 1 - Mitos del NOA"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={files.length === 1}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Descripción Pedagógica (Opcional)</label>
          <textarea
            className="form-textarea"
            rows="2"
            placeholder="Indicaciones para los alumnos sobre cómo utilizar este material..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Carpeta</label>
            <select
              className="form-select"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
            >
              <option value="">(Raíz de la materia)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Unidad Temática</label>
            <select
              className="form-select"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
            >
              <option value="">(Sin asignar)</option>
              {units.map((u) => (
                <option key={u.unit} value={u.unit}>Unidad {u.unit}: {u.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Estado de Publicación</label>
          <select
            className="form-select"
            value={publicationStatus}
            onChange={(e) => setPublicationStatus(e.target.value)}
          >
            <option value="published">Publicado (Visible para alumnos autorizados)</option>
            <option value="draft">Borrador (Solo visible para docentes)</option>
            <option value="hidden">Oculto temporalmente</option>
          </select>
        </div>

        {uploading && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>Subiendo archivo al almacenamiento institucional...</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary-800)', transition: 'width 0.2s' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={uploading}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={uploading || files.length === 0}>
            {uploading ? 'Subiendo...' : 'Guardar en la Biblioteca'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
