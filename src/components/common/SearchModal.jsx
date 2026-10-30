import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, FileText, Calendar, CheckSquare, Sparkles, X } from 'lucide-react';
import { subjectService } from '../../services/subjectService';
import { materialService } from '../../services/materialService';
import { classService } from '../../services/classService';
import { activityService } from '../../services/activityService';
import { useAuth } from '../../context/AuthContext';

export const SearchModal = ({ isOpen, onClose }) => {
  const { user, isTeacher } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, subjects, classes, materials, activities
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchContent = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);

      try {
        const terms = query.toLowerCase();
        const found = [];

        // 1. Search Subjects
        const subjects = isTeacher
          ? await subjectService.getTeacherSubjects(user?.id)
          : await subjectService.getStudentSubjects(user?.id);

        subjects.forEach((s) => {
          if (s.name.toLowerCase().includes(terms) || (s.code && s.code.toLowerCase().includes(terms))) {
            found.push({
              id: s.id,
              type: 'subject',
              title: s.name,
              subtitle: `Código: ${s.code || 'N/A'} • ${s.courses?.name || ''}`,
              link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/materia/${s.id}`,
            });
          }
        });

        // 2. Search inside authorized subjects for materials, classes, activities
        for (const s of subjects.slice(0, 5)) {
          // Materials
          const mats = await materialService.getMaterials(s.id, !isTeacher);
          mats.forEach((m) => {
            if (m.title.toLowerCase().includes(terms) || (m.description && m.description.toLowerCase().includes(terms))) {
              found.push({
                id: m.id,
                type: 'material',
                title: m.title,
                subtitle: `Material en ${s.name} • ${m.resource_type.toUpperCase()}`,
                link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/biblioteca`,
              });
            }
          });

          // Classes
          const classes = await classService.getClasses(s.id, !isTeacher);
          classes.forEach((c) => {
            if (c.title.toLowerCase().includes(terms) || (c.content && c.content.toLowerCase().includes(terms))) {
              found.push({
                id: c.id,
                type: 'class',
                title: c.title,
                subtitle: `Clase del ${c.class_date} en ${s.name}`,
                link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/materia/${s.id}`,
              });
            }
          });

          // Activities
          const acts = await activityService.getActivities(s.id, !isTeacher);
          acts.forEach((a) => {
            if (a.title.toLowerCase().includes(terms) || (a.description && a.description.toLowerCase().includes(terms))) {
              found.push({
                id: a.id,
                type: 'activity',
                title: a.title,
                subtitle: `Actividad en ${s.name}`,
                link: isTeacher ? `/profesor/materia/${s.id}` : `/estudiante/materia/${s.id}`,
              });
            }
          });
        }

        setResults(found);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchContent, 300);
    return () => clearTimeout(timer);
  }, [query, isTeacher, user]);

  if (!isOpen) return null;

  const filteredResults = filterType === 'all'
    ? results
    : results.filter((r) => r.type === filterType.slice(0, -1)); // e.g. 'materials' -> 'material'

  const handleSelect = (link) => {
    onClose();
    navigate(link);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'subject': return <BookOpen size={18} color="var(--primary-600)" />;
      case 'material': return <FileText size={18} color="var(--accent-600)" />;
      case 'class': return <Calendar size={18} color="var(--amber-600)" />;
      case 'activity': return <CheckSquare size={18} color="var(--success-600)" />;
      default: return <Search size={18} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <Search size={22} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar materias, documentos, clases, actividades..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-main)',
              color: 'var(--text-main)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--bg-muted)',
          borderBottom: '1px solid var(--border-light)',
          overflowX: 'auto',
        }}>
          {[
            { id: 'all', label: 'Todo' },
            { id: 'subjects', label: 'Materias' },
            { id: 'materials', label: 'Documentos' },
            { id: 'classes', label: 'Clases' },
            { id: 'activities', label: 'Actividades' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: filterType === f.id ? 'var(--primary-800)' : 'var(--bg-surface)',
                color: filterType === f.id ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
                fontSize: '0.8rem',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem 0' }}>
          {loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Buscando contenidos autorizados...
            </div>
          )}

          {!loading && query.length >= 2 && filteredResults.length === 0 && (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron resultados para "<strong>{query}</strong>".
            </div>
          )}

          {!loading && query.length < 2 && (
            <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Escribí al menos 2 letras para buscar en tus contenidos educativos autorizados.
            </div>
          )}

          {!loading && filteredResults.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelect(item.link)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.8rem 1.25rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                transition: 'background-color var(--trans-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-muted)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-page)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
