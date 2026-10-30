import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { subjectService } from '../../services/subjectService';
import { previousSubjectsService } from '../../services/previousSubjectsService';
import { materialService } from '../../services/materialService';
import { 
  BookmarkCheck, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Plus, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';

export const PreviousSubjectsPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [studentPreps, setStudentPreps] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subjectMaterials, setSubjectMaterials] = useState([]);

  // Add new prep modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [preps, subjects] = await Promise.all([
        previousSubjectsService.getStudentPreps(user?.id),
        subjectService.getSubjects(),
      ]);

      setStudentPreps(preps);
      setAllSubjects(subjects);

      if (preps.length > 0) {
        selectPlan(preps[0], subjects);
      } else {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const selectPlan = async (plan, subjectsList = allSubjects) => {
    const fullSub = subjectsList.find((s) => s.id === plan.subject_id) || plan.subjects;
    setSelectedPlan({ ...plan, fullSubject: fullSub });
    // Fetch materials for this subject
    const mats = await materialService.getMaterials(plan.subject_id, true);
    setSubjectMaterials(mats);
  };

  const handleToggleUnit = async (unitNumber) => {
    if (!selectedPlan) return;
    const totalUnits = selectedPlan.fullSubject?.syllabus?.length || 1;
    const updated = await previousSubjectsService.toggleUnitCompletion(
      user?.id,
      selectedPlan.subject_id,
      unitNumber,
      totalUnits
    );
    if (updated) {
      const fullSub = selectedPlan.fullSubject;
      setSelectedPlan({ ...updated, fullSubject: fullSub });
      setStudentPreps((prev) =>
        prev.map((p) => (p.subject_id === updated.subject_id ? { ...updated, fullSubject: fullSub } : p))
      );
      showToast('Progreso personal actualizado.', 'success');
    }
  };

  const handleAddPlanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setSaving(true);
    try {
      const newPlan = await previousSubjectsService.addSubjectPrep(
        user?.id,
        selectedSubjectId,
        targetDate || null,
        personalNotes
      );
      showToast('Materia agregada a tu plan de estudio personal.', 'success');
      setShowAddModal(false);
      setSelectedSubjectId('');
      setTargetDate('');
      setPersonalNotes('');
      await loadData();
    } catch (err) {
      showToast('Error al agregar materia.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Consultando módulo de materias previas..." />;

  const prepSubjectIds = studentPreps.map((p) => p.subject_id);
  const availableToAdd = allSubjects.filter((s) => !prepSubjectIds.includes(s.id));

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
            Preparación de Materias Previas y Pendientes
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Organizá tu plan de repaso personal, consultá programas oficiales verificados y preparate con el tutor inteligente.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> Preparar Nueva Materia
        </button>
      </div>

      {/* Institutional Clarity Notice */}
      <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Aclaración Institucional Importante:</strong> El progreso registrado y las fechas fijadas en esta sección corresponden a tu <em>plan de estudio personal</em>. Las fechas oficiales de mesas de examen y los requisitos formales de acreditación deben ser confirmados a través de Secretaría o Rectoría de la Escuela Normal.
        </div>
      </div>

      {studentPreps.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No tenés planes de materias previas activos"
          description="Si adeudás algún espacio curricular o querés organizar con anticipación el repaso de una materia, agregala aquí."
          actionLabel="Agregar Materia para Preparar"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: List of Preps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Materias en Preparación ({studentPreps.length})
            </div>

            {studentPreps.map((prep) => {
              const sub = allSubjects.find((s) => s.id === prep.subject_id) || prep.subjects;
              const isSelected = selectedPlan?.subject_id === prep.subject_id;
              return (
                <div
                  key={prep.id || prep.subject_id}
                  onClick={() => selectPlan(prep)}
                  className="card card-interactive"
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary-700)' : '1px solid var(--border-light)',
                    backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="badge badge-primary">{sub?.courses?.name || 'Materia'}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-600)' }}>
                      {prep.progress_percent || 0}% repasado
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
                    {sub?.name}
                  </h4>

                  {/* Progress bar */}
                  <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ width: `${prep.progress_percent || 0}%`, height: '100%', backgroundColor: 'var(--success-600)' }} />
                  </div>

                  {prep.target_exam_date && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} /> Meta personal: {prep.target_exam_date}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Study Hub */}
          {selectedPlan && selectedPlan.fullSubject && (
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
                    Programa Oficial Verificado • {selectedPlan.fullSubject.courses?.name || 'Espacio'}
                  </span>
                  <h3 style={{ fontSize: '1.5rem', color: 'var(--primary-900)', margin: '0.2rem 0' }}>
                    {selectedPlan.fullSubject.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Código: {selectedPlan.fullSubject.code || 'S/C'}
                  </div>
                </div>

                <Link
                  to={`/tutor-ia?subject=${selectedPlan.subject_id}`}
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles size={14} /> Practicar con el Tutor IA
                </Link>
              </div>

              {/* Personal Notes / Meta */}
              {selectedPlan.notes && (
                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  <strong>Mis notas de estudio:</strong> {selectedPlan.notes}
                </div>
              )}

              {/* Official Units Checklist */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckSquare size={18} color="var(--primary-800)" />
                  Control de Unidades y Ejes Temáticos del Programa
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(!selectedPlan.fullSubject.syllabus || selectedPlan.fullSubject.syllabus.length === 0) ? (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                      El programa oficial de esta materia está en proceso de verificación por la institución.
                    </div>
                  ) : (
                    selectedPlan.fullSubject.syllabus.map((u) => {
                      const isDone = Array.isArray(selectedPlan.completed_units) && selectedPlan.completed_units.includes(u.unit);
                      return (
                        <div
                          key={u.unit}
                          onClick={() => handleToggleUnit(u.unit)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.85rem',
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isDone ? 'var(--success-50)' : 'var(--bg-muted)',
                            border: isDone ? '1px solid var(--success-500)' : '1px solid var(--border-light)',
                            cursor: 'pointer',
                            transition: 'all var(--trans-fast)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {}} // handled by parent onClick
                            style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--success-600)' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isDone ? 'var(--success-600)' : 'var(--text-main)' }}>
                              Unidad {u.unit}: {u.title}
                            </div>
                            {u.description && (
                              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                {u.description}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Verified Study Documents */}
              <div>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--primary-800)" />
                  Materiales de Estudio Autorizados para esta Materia ({subjectMaterials.length})
                </h4>

                {subjectMaterials.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No se registran documentos públicos asociados en este momento.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {subjectMaterials.map((mat) => (
                      <div key={mat.id} style={{ padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-page)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{mat.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mat.resource_type.toUpperCase()}</div>
                        </div>
                        <a href={mat.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ padding: '0.35rem' }}>
                          <FileText size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Subject Plan Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Incorporar Materia a tu Plan de Preparación"
        maxWidth="520px"
      >
        <form onSubmit={handleAddPlanSubmit}>
          <div className="form-group">
            <label className="form-label">Seleccioná la Materia a Preparar *</label>
            <select
              required
              className="form-select"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="">-- Elegí un espacio curricular --</option>
              {availableToAdd.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.courses?.name || 'Secundario'})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha Objetivo Personal para Rendir (Opcional)</label>
            <input
              type="date"
              className="form-input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Esta fecha te servirá como recordatorio para tu propio calendario de estudio.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Anotaciones Personales (Opcional)</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Ej: Tengo pendiente rendir las unidades 2 y 3. El profesor indicó priorizar los trabajos prácticos..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !selectedSubjectId}>
              {saving ? 'Guardando...' : 'Comenzar a Preparar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
