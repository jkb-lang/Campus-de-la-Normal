import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subjectService } from '../../services/subjectService';
import { classService } from '../../services/classService';
import { activityService } from '../../services/activityService';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  CheckSquare, 
  Clock, 
  Filter 
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CalendarPage = () => {
  const { user, isTeacher } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar View: 'month', 'week', 'day'
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        const subs = isTeacher
          ? await subjectService.getTeacherSubjects(user?.id)
          : await subjectService.getStudentSubjects(user?.id);
        setSubjects(subs);

        const allEvents = [];
        for (const sub of subs) {
          // Fetch classes
          const classes = await classService.getClasses(sub.id, !isTeacher);
          classes.forEach((c) => {
            allEvents.push({
              id: c.id,
              type: 'class',
              title: c.title,
              date: c.class_date,
              subjectName: sub.name,
              subjectId: sub.id,
              detail: c.content || c.unit_topic,
              link: isTeacher ? `/profesor/materia/${sub.id}` : `/estudiante/materia/${sub.id}`,
            });
          });

          // Fetch activities
          const activities = await activityService.getActivities(sub.id, !isTeacher);
          activities.forEach((a) => {
            if (a.due_date) {
              allEvents.push({
                id: a.id,
                type: 'activity',
                title: a.title,
                date: a.due_date.split('T')[0],
                subjectName: sub.name,
                subjectId: sub.id,
                detail: `Fecha límite de entrega`,
                link: isTeacher ? `/profesor/materia/${sub.id}` : `/estudiante/materia/${sub.id}`,
              });
            }
          });
        }

        setEvents(allEvents);
      } catch (err) {
        console.error('Calendar error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user, isTeacher]);

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (currentView === 'month') next.setMonth(next.getMonth() + 1);
    else if (currentView === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (currentView === 'month') prev.setMonth(prev.getMonth() - 1);
    else if (currentView === 'week') prev.setDate(prev.getDate() - 7);
    else prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const todayPeriod = () => {
    setCurrentDate(new Date());
  };

  if (loading) return <LoadingSpinner text="Organizando calendario académico..." />;

  const filteredEvents = events.filter((e) => {
    return selectedSubjectId === 'all' || e.subjectId === selectedSubjectId;
  });

  // Month grid calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

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
            Calendario Académico Integrado
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Clases dictadas, actividades prácticas y fechas límites de entrega de tus materias.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="all">Todas las materias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', border: '1px solid var(--border-light)' }}>
            <button
              onClick={() => setCurrentView('month')}
              className="btn btn-sm"
              style={{
                backgroundColor: currentView === 'month' ? 'var(--primary-800)' : 'transparent',
                color: currentView === 'month' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Mes
            </button>
            <button
              onClick={() => setCurrentView('week')}
              className="btn btn-sm"
              style={{
                backgroundColor: currentView === 'week' ? 'var(--primary-800)' : 'transparent',
                color: currentView === 'week' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Semana
            </button>
            <button
              onClick={() => setCurrentView('day')}
              className="btn btn-sm"
              style={{
                backgroundColor: currentView === 'day' ? 'var(--primary-800)' : 'transparent',
                color: currentView === 'day' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
              }}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-surface)',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={prevPeriod} className="btn btn-ghost btn-sm" style={{ padding: '0.3rem' }}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={todayPeriod} className="btn btn-secondary btn-sm">
            Hoy
          </button>
          <button onClick={nextPeriod} className="btn btn-ghost btn-sm" style={{ padding: '0.3rem' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-900)', margin: 0 }}>
          {monthNames[month]} {year}
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }} />
            Clases
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--amber-500)' }} />
            Vencimiento Tareas
          </span>
        </div>
      </div>

      {/* Month View Grid */}
      {currentView === 'month' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Weekday headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: 'var(--bg-muted)',
            borderBottom: '1px solid var(--border-light)',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            padding: '0.6rem 0',
          }}>
            <div>DOM</div>
            <div>LUN</div>
            <div>MAR</div>
            <div>MIÉ</div>
            <div>JUE</div>
            <div>VIE</div>
            <div>SÁB</div>
          </div>

          {/* Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '480px' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ backgroundColor: 'var(--bg-page)', borderRight: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', opacity: 0.4 }} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
              const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

              return (
                <div
                  key={`day-${dayNum}`}
                  style={{
                    minHeight: '90px',
                    padding: '0.4rem',
                    borderRight: '1px solid var(--border-light)',
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: isToday ? 'var(--primary-50)' : 'var(--bg-surface)',
                  }}
                >
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 800 : 600,
                    color: isToday ? 'var(--primary-800)' : 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}>
                    {dayNum}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {dayEvents.map((ev) => (
                      <Link
                        key={`${ev.type}-${ev.id}`}
                        to={ev.link}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.4rem',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: ev.type === 'class' ? 'var(--primary-100)' : 'var(--amber-100)',
                          color: ev.type === 'class' ? 'var(--primary-900)' : 'var(--amber-600)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                        }}
                        title={`${ev.title} (${ev.subjectName})`}
                      >
                        {ev.type === 'class' ? '📚' : '📌'} {ev.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day list representation */}
      {(currentView === 'week' || currentView === 'day') && (
        <div className="card">
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary-900)' }}>
            Eventos y Actividades para este período
          </h4>
          {filteredEvents.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se registran eventos de clases o actividades con fecha en este período.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredEvents.map((ev) => (
                <div key={`${ev.type}-${ev.id}`} style={{ padding: '0.85rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className={`badge ${ev.type === 'class' ? 'badge-primary' : 'badge-warning'}`}>
                        {ev.type === 'class' ? 'Clase' : 'Fecha de Entrega'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.date}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ev.subjectName}</div>
                  </div>
                  <Link to={ev.link} className="btn btn-secondary btn-sm">
                    Ver en Aula
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
