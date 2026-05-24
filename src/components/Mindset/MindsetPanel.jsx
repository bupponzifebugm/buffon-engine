import { useState } from 'react';
import { Brain, BookOpen, Quote, ChevronDown, ChevronUp, Sparkles, Plus, Trash2, Calendar } from 'lucide-react';
import { MINDSET_SHIFTS, THIRTEEN_LESSONS, MINDSET_QUOTES } from '../../lib/constants';

export default function MindsetPanel({ profile, onUpdateProfile }) {
  // Track which mindset cards are expanded (multiple can be open)
  const [expandedCards, setExpandedCards] = useState({});
  // Track which lesson is open (only one at a time)
  const [openLesson, setOpenLesson] = useState(null);

  // Form states for schedule
  const [newDay, setNewDay] = useState('1'); // Monday
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('10:00');
  const [newClassName, setNewClassName] = useState('');

  // Form states for holiday
  const [newHolidayDate, setNewHolidayDate] = useState('');

  const schedule = profile?.class_schedule || [];
  const holidays = profile?.observed_holidays || [];

  const daysOfWeek = {
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
  };

  async function handleAddClass() {
    if (!newClassName.trim()) {
      alert('Masukkan nama kelas.');
      return;
    }
    const updated = [
      ...schedule,
      {
        id: Date.now().toString(),
        day: parseInt(newDay),
        start: newStart,
        end: newEnd,
        name: newClassName.trim()
      }
    ];
    if (onUpdateProfile) {
      await onUpdateProfile({ class_schedule: updated });
    }
    setNewClassName('');
  }

  async function handleDeleteClass(id) {
    const updated = schedule.filter(c => c.id !== id);
    if (onUpdateProfile) {
      await onUpdateProfile({ class_schedule: updated });
    }
  }

  async function handleAddHoliday() {
    if (!newHolidayDate) return;
    if (holidays.includes(newHolidayDate)) {
      alert('Libur sudah terdaftar.');
      return;
    }
    const updated = [...holidays, newHolidayDate].sort();
    if (onUpdateProfile) {
      await onUpdateProfile({ observed_holidays: updated });
    }
    setNewHolidayDate('');
  }

  async function handleDeleteHoliday(dateStr) {
    const updated = holidays.filter(d => d !== dateStr);
    if (onUpdateProfile) {
      await onUpdateProfile({ observed_holidays: updated });
    }
  }

  function toggleCard(idx) {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function toggleLesson(num) {
    setOpenLesson((prev) => (prev === num ? null : num));
  }

  return (
    <div className="mindset-container">
      {/* ── Section 1: UGM Academic & Holiday Settings ── */}
      {profile && (
        <div className="card">
          <div className="card-title">
            <Calendar size={16} style={{ color: 'var(--purple)' }} />
            UGM Academic Schedule & Holidays Guard
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Set your weekly class times and active holidays. The app automatically locks execution to *Observation Mode* during class hours or on holidays.
          </p>

          <div className="grid-2">
            {/* Class schedule list & form */}
            <div style={{ borderRight: '1px solid var(--border)', paddingRight: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, color: 'var(--purple)' }}>Weekly Class Slots</h4>
              
              <div className="mistake-form" style={{ background: 'transparent', border: 'none', padding: 0, gap: 10, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Day</label>
                    <select value={newDay} onChange={e => setNewDay(e.target.value)}>
                      {Object.entries(daysOfWeek).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Start</label>
                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>End</label>
                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                  </div>
                </div>
                
                <div className="field">
                  <label>Class / Course Name</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="text" 
                      placeholder="e.g. Macroeconomics v3" 
                      value={newClassName} 
                      onChange={e => setNewClassName(e.target.value)} 
                      style={{ flex: 1, color: 'var(--text-primary)', background: 'var(--bg-tertiary)', caretColor: 'var(--accent)' }}
                    />
                    <button className="btn" onClick={handleAddClass} style={{ margin: 0, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule list */}
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {schedule.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>No active class sessions configured. Free schedule!</div>
                ) : (
                  schedule.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: 'var(--purple)' }}>{daysOfWeek[c.day] || 'Day'}:</span>{' '}
                        {c.start} - {c.end} | <strong>{c.name}</strong>
                      </div>
                      <button 
                        onClick={() => handleDeleteClass(c.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 2 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Observed holidays list & form */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, color: 'var(--accent)' }}>Observed Holidays</h4>
              
              <div className="field">
                <label>Holiday Date</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn" onClick={handleAddHoliday} style={{ margin: 0, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Holidays list */}
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {holidays.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>No holidays added yet.</div>
                ) : (
                  holidays.map(d => (
                    <div key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 11 }}>
                      <span>{new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <button 
                        onClick={() => handleDeleteHoliday(d)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Unfuck Ur Mindset ── */}
      <div className="card">
        <div className="card-title">
          <Brain size={16} />
          Unfuck Ur Mindset
        </div>

        <div className="mindset-cards">
          {(MINDSET_SHIFTS || []).map((shift, idx) => (
            <div
              key={idx}
              className={`mindset-card ${expandedCards[idx] ? 'expanded' : ''}`}
            >
              <div className="mindset-card-header" onClick={() => toggleCard(idx)}>
                <span>{shift.title}</span>
                {expandedCards[idx] ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
              {expandedCards[idx] && (
                <div className="mindset-card-body">
                  <ul>
                    {shift.points.map((point, pIdx) => (
                      <li key={pIdx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: The 13 Lessons ── */}
      <div className="card">
        <div className="card-title">
          <BookOpen size={16} />
          The 13 Lessons
        </div>

        <div className="lessons-list">
          {(THIRTEEN_LESSONS || []).map((lesson) => (
            <div
              key={lesson.number}
              className={`lesson-item ${openLesson === lesson.number ? 'expanded' : ''}`}
            >
              <div
                className="lesson-header"
                onClick={() => toggleLesson(lesson.number)}
              >
                <div className="lesson-header-left">
                  <span className="lesson-number">{lesson.number}</span>
                  <span className="lesson-title">{lesson.title}</span>
                </div>
                {openLesson === lesson.number ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
              {openLesson === lesson.number && (
                <div className="lesson-body">
                  <p>{lesson.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Mindset Quotes ── */}
      <div className="card">
        <div className="card-title">
          <Quote size={16} />
          Mindset Quotes
        </div>

        <div className="mindset-quotes">
          {(MINDSET_QUOTES || []).map((quote, idx) => (
            <div key={idx} className="mindset-quote">
              <Sparkles size={14} className="quote-icon" />
              <span className="mindset-quote-text">{quote}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: Stockbit vs Ajaib Warning ── */}
      <div className="platform-warning">
        <AlertTriangleBanner />
      </div>
    </div>
  );
}

function AlertTriangleBanner() {
  return (
    <div className="platform-warning-inner">
      <div className="platform-warning-icon">⚠️</div>
      <div className="platform-warning-text">
        <strong>STOCKBIT</strong> (Scalp/Intraday ONLY) ↔ <strong>AJAIB</strong> (Investing ONLY).
        Separate worlds. NEVER mix.
        <br />
        <span className="platform-warning-sub">
          Mixing invest thesis with scalp execution = confusion = losses.
        </span>
      </div>
    </div>
  );
}
