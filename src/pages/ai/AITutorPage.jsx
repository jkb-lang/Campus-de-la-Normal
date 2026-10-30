import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { aiService } from '../../services/aiService';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  Trash2, 
  HelpCircle, 
  FileText, 
  CheckCircle, 
  ListOrdered, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AITutorPage = () => {
  const [searchParams] = useSearchParams();
  const initialSubjectId = searchParams.get('subject');

  const { user, isTeacher } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const initTutor = async () => {
      setInitializing(true);
      try {
        const subs = isTeacher
          ? await subjectService.getTeacherSubjects(user?.id)
          : await subjectService.getStudentSubjects(user?.id);

        setSubjects(subs);

        if (subs.length > 0) {
          const defaultSub = initialSubjectId
            ? subs.find((s) => s.id === initialSubjectId) || subs[0]
            : subs[0];
          setSelectedSubject(defaultSub);
          const history = await aiService.getChatHistory(defaultSub.id, user?.id);
          setMessages(history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitializing(false);
      }
    };

    initTutor();
  }, [user, isTeacher, initialSubjectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubjectChange = async (subId) => {
    const chosen = subjects.find((s) => s.id === subId);
    if (!chosen) return;
    setSelectedSubject(chosen);
    setLoading(true);
    const history = await aiService.getChatHistory(chosen.id, user?.id);
    setMessages(history);
    setLoading(false);
  };

  const handleSendMessage = async (promptText = null, mode = 'explain') => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || !selectedSubject) return;

    const userMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      message: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputPrompt('');
    setLoading(true);

    try {
      const response = await aiService.askTutor(selectedSubject, user?.id, textToSend, mode);
      const assistantMsg = {
        id: 'resp-' + Date.now(),
        role: 'assistant',
        message: response.message,
        sources: response.sources,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedSubject) return;
    await aiService.clearChat(selectedSubject.id, user?.id);
    setMessages([]);
  };

  if (initializing) return <LoadingSpinner text="Iniciando Tutor Inteligente de Campus: La Normal..." />;

  if (subjects.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '600px', margin: '2rem auto' }}>
        <Sparkles size={36} color="var(--primary-800)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-900)' }}>No tenés materias autorizadas</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Para consultar al tutor pedagógico, primero debés contar con acceso a al menos un espacio curricular oficial.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-800)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Tutor Pedagógico Inteligente
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                <ShieldCheck size={12} /> Fuentes Verificadas
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Campus: La Normal • “Aprender mejor, juntos.”
            </div>
          </div>
        </div>

        {/* Subject Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Materia de consulta:
          </span>
          <select
            className="form-select"
            style={{ width: 'auto', fontWeight: 600, color: 'var(--primary-900)' }}
            value={selectedSubject?.id || ''}
            onChange={(e) => handleSubjectChange(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code || 'S/C'})</option>
            ))}
          </select>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn btn-ghost btn-sm"
              title="Borrar conversación de esta materia"
              style={{ color: 'var(--danger-600)', padding: '0.4rem' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Quick Actions */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '0.5rem',
      }}>
        <button
          onClick={() => handleSendMessage('Explicame el tema principal de esta materia de manera sencilla y clara.', 'explain')}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          💡 Explicar conceptos clave
        </button>
        <button
          onClick={() => handleSendMessage('Generá un cuestionario de práctica de 3 preguntas basado en los textos autorizados.', 'quiz')}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          📝 Cuestionario de práctica
        </button>
        <button
          onClick={() => handleSendMessage('Prepará una síntesis de los documentos de estudio disponibles.', 'summary')}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          📄 Resumen de bibliografía
        </button>
        <button
          onClick={() => handleSendMessage('Elaborá una guía de estudio paso a paso para repasar la unidad.', 'guide')}
          className="btn btn-secondary btn-sm"
          style={{ borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          🎯 Guía de estudio
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '480px', padding: '2rem 1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <Sparkles size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
              ¿En qué podemos profundizar hoy?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Haceme preguntas sobre los textos, pedime explicaciones paso a paso o practicá con cuestionarios formulados a partir de los documentos oficiales de <strong>{selectedSubject?.name}</strong>.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '82%',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isUser ? 'var(--primary-800)' : 'var(--bg-muted)',
                  color: isUser ? '#ffffff' : 'var(--text-main)',
                  border: isUser ? 'none' : '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-xs)',
                  fontSize: '0.925rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.message}

                  {/* Sources citation badge if present */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border-medium)',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Fuentes consultadas del aula:</div>
                      {msg.sources.map((src, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <FileText size={12} /> {src.title} {src.unit ? `(${src.unit})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid var(--primary-100)',
                borderTopColor: 'var(--primary-800)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span>El tutor está analizando los contenidos autorizados...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{
          marginTop: '0.75rem',
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder={`Escribí tu pregunta sobre ${selectedSubject?.name || 'la materia'}...`}
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={loading}
          style={{ fontSize: '0.95rem' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !inputPrompt.trim()}
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
