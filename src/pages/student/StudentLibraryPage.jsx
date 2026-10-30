import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { materialService } from '../../services/materialService';
import { 
  FolderArchive, 
  Search, 
  Download, 
  FileText, 
  Filter, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentLibraryPage = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [materials, setMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const studentSubs = await subjectService.getStudentSubjects(user?.id);
        setSubjects(studentSubs);

        // Fetch materials from all enrolled subjects
        const allMats = [];
        for (const sub of studentSubs) {
          const subMats = await materialService.getMaterials(sub.id, true);
          allMats.push(...subMats.map((m) => ({ ...m, subjectName: sub.name, subjectCode: sub.code })));
        }
        setMaterials(allMats);
      } catch (err) {
        console.error('Library loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLibrary();
  }, [user]);

  if (loading) return <LoadingSpinner text="Consultando biblioteca de materiales..." />;

  const filteredMaterials = materials.filter((m) => {
    const matchesSub = selectedSubjectId === 'all' || m.subject_id === selectedSubjectId;
    const matchesType = selectedType === 'all' || m.resource_type === selectedType;
    const matchesSearch = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSub && matchesType && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
          Biblioteca de Materiales de Estudio
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Consultá y descargá la bibliografía oficial, textos y guías publicadas por tus profesores de las materias habilitadas.
        </p>
      </div>

      {/* Institutional Notice: Read-only Consultation */}
      <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
        <FolderArchive size={18} />
        <span>
          <strong>Espacio Oficial de Consulta:</strong> Esta biblioteca reúne documentos pedagógicos verificados. Para enviar trabajos prácticos, ingresá a la actividad correspondiente en tu aula.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por título o nombre de archivo..."
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="all">Todas las materias habilitadas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Todos los formatos</option>
            <option value="pdf">Documentos PDF</option>
            <option value="doc">Word / Texto</option>
            <option value="slides">Presentaciones</option>
            <option value="sheet">Planillas de cálculo</option>
            <option value="image">Imágenes</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredMaterials.length} documentos encontrados
        </div>
      </div>

      {/* Documents Grid */}
      {filteredMaterials.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="No se encontraron documentos"
          description="No hay archivos publicados que coincidan con los filtros seleccionados."
        />
      ) : (
        <div className="grid-cards">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="card card-interactive"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{mat.subjectName}</span>
                  <span className="badge badge-neutral">{mat.resource_type.toUpperCase()}</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-900)', marginBottom: '0.4rem' }}>
                  {mat.title}
                </h3>

                {mat.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                    {mat.description}
                  </p>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  {mat.unit_number && <span>Unidad {mat.unit_number} • </span>}
                  {mat.file_name} ({(mat.file_size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                <a
                  href={mat.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                >
                  <Download size={14} /> Descargar Documento
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
