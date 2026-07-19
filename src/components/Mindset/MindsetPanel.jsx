import { useState } from 'react';
import { Brain, BookOpen, Quote, ChevronDown, ChevronUp, Sparkles, Plus, Trash2, Calendar, Target } from 'lucide-react';
import { MINDSET_SHIFTS, THIRTEEN_LESSONS, MINDSET_QUOTES, PSYCHOLOGY_LESSONS } from '../../lib/constants';
import TiltBreaker from './TiltBreaker';

export default function MindsetPanel({ profile, onUpdateProfile }) {
  // Track which mindset cards are flipped
  const [flippedMindset, setFlippedMindset] = useState({});
  const [flippedLessons, setFlippedLessons] = useState({});
  const [flippedPsychology, setFlippedPsychology] = useState({});

  const [activeQuoteIdx, setActiveQuoteIdx] = useState(() => Math.floor(Math.random() * (MINDSET_QUOTES?.length || 1)));
  const [isFading, setIsFading] = useState(false);

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

  function toggleMindsetCard(idx) {
    setFlippedMindset((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  function toggleLesson(num) {
    setFlippedLessons((prev) => ({
      ...prev,
      [num]: !prev[num]
    }));
  }

  function togglePsychologyLesson(num) {
    setFlippedPsychology((prev) => ({
      ...prev,
      [num]: !prev[num]
    }));
  }

  function drawRandomQuote() {
    setIsFading(true);
    setTimeout(() => {
      let nextIdx = activeQuoteIdx;
      if (MINDSET_QUOTES.length > 1) {
        while (nextIdx === activeQuoteIdx) {
          nextIdx = Math.floor(Math.random() * MINDSET_QUOTES.length);
        }
      }
      setActiveQuoteIdx(nextIdx);
      setIsFading(false);
    }, 200);
  }

  return (
    <div className="mindset-container">
      {/* ── Section 0: Emergency Tilt Breaker ── */}
      <div style={{ marginBottom: 20 }}>
        <TiltBreaker />
      </div>

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
                      className="ugm-class-input"
                      style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}
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
          <Brain size={16} style={{ color: 'var(--danger)' }} />
          Unfuck Ur Mindset
        </div>

        <div className="mindset-cards-grid">
          {(MINDSET_SHIFTS || []).map((shift, idx) => {
            const isFlipped = !!flippedMindset[idx];
            return (
              <div 
                key={idx} 
                className={`perspective-container ${isFlipped ? 'flipped' : ''}`}
                style={{ height: '190px' }}
                onClick={() => toggleMindsetCard(idx)}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--danger)',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      lineHeight: '1.4',
                      padding: '0 8px'
                    }}>
                      {shift.title.replace(/^\d+\.\s*/, '')}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Click to reveal ➜</span>
                  </div>
                  <div className="flip-card-back" style={{ borderColor: 'var(--danger)', padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: 'var(--danger)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Shift {idx + 1}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: 'var(--text-primary)' }}>
                      {shift.points.map((point, pIdx) => (
                        <li key={pIdx} style={{ marginBottom: '4px', lineHeight: '1.4' }}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: The 13 Lessons ── */}
      <div className="card">
        <div className="card-title">
          <BookOpen size={16} />
          The 13 Lessons
        </div>

        <div className="mindset-cards-grid">
          {(THIRTEEN_LESSONS || []).map((lesson) => {
            const isFlipped = !!flippedLessons[lesson.number];
            return (
              <div 
                key={lesson.number} 
                className={`perspective-container ${isFlipped ? 'flipped' : ''}`}
                onClick={() => toggleLesson(lesson.number)}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front" style={{ borderLeft: '3px solid var(--accent)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--accent)',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {lesson.number}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      {lesson.title}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Click to reveal ➜</span>
                  </div>
                  <div className="flip-card-back">
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Lesson {lesson.number}
                    </div>
                    <p style={{ margin: 0 }}>{lesson.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3.5: 10 Fundamental Trading Psychology Lessons ── */}
      <div className="card">
        <div className="card-title">
          <Target size={16} style={{ color: '#a855f7' }} />
          10 Fundamental Trading Psychology Lessons
        </div>

        <div className="mindset-cards-grid">
          {(PSYCHOLOGY_LESSONS || []).map((lesson) => {
            const isFlipped = !!flippedPsychology[lesson.number];
            return (
              <div 
                key={lesson.number} 
                className={`perspective-container ${isFlipped ? 'flipped' : ''}`}
                onClick={() => togglePsychologyLesson(lesson.number)}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front" style={{ borderLeft: '3px solid #a855f7' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(168, 85, 247, 0.1)',
                      color: '#a855f7',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {lesson.number}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      lineHeight: '1.4'
                    }}>
                      {lesson.title}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Click to reveal ➜</span>
                  </div>
                  <div className="flip-card-back" style={{ borderColor: '#a855f7' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#a855f7', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Truth {lesson.number}
                    </div>
                    <p style={{ margin: 0 }}>{lesson.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Mindset Quotes ── */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Quote size={16} style={{ color: 'var(--accent)' }} />
            <span>Wisdom Card & Quotes</span>
          </div>
          <button 
            className="btn"
            onClick={drawRandomQuote}
            style={{ 
              margin: 0, 
              padding: '4px 10px', 
              fontSize: '11px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'var(--surface)', 
              border: '1px solid var(--border)', 
              color: 'var(--text-primary)', 
              width: 'auto' 
            }}
          >
            🔮 Draw Wisdom
          </button>
        </div>

        {/* Interactive Quote Board */}
        <div style={{
          position: 'relative',
          padding: '24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          textAlign: 'center',
          minHeight: '100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'all 0.3s',
          marginTop: '12px'
        }}>
          {/* Large Quote Marks Icon */}
          <div style={{
            position: 'absolute',
            top: '5px',
            left: '12px',
            fontSize: '48px',
            fontFamily: 'serif',
            color: 'var(--border-strong)',
            opacity: 0.15,
            lineHeight: 1,
            pointerEvents: 'none'
          }}>“</div>

          <div style={{
            opacity: isFading ? 0 : 1,
            transition: 'opacity 0.2s ease-in-out',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            padding: '0 20px',
            fontStyle: 'italic'
          }}>
            {MINDSET_QUOTES[activeQuoteIdx]}
          </div>

          <div style={{
            position: 'absolute',
            bottom: '5px',
            right: '12px',
            fontSize: '48px',
            fontFamily: 'serif',
            color: 'var(--border-strong)',
            opacity: 0.15,
            lineHeight: 1,
            pointerEvents: 'none'
          }}>”</div>
        </div>

        {/* Collapsible View All Quotes Section */}
        <details style={{ marginTop: '14px' }}>
          <summary style={{ 
            fontSize: '11px', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer', 
            userSelect: 'none',
            padding: '4px',
            fontWeight: 'bold'
          }}>
            View All Quotes ({MINDSET_QUOTES.length})
          </summary>
          <div className="mindset-quotes" style={{ 
            marginTop: '10px', 
            maxHeight: '220px', 
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '6px'
          }}>
            {(MINDSET_QUOTES || []).map((quote, idx) => (
              <div key={idx} className="mindset-quote" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderLeft: idx === activeQuoteIdx ? '3px solid var(--accent)' : '3px solid var(--border-strong)',
                borderRadius: '4px',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}>
                <Sparkles size={12} style={{ color: idx === activeQuoteIdx ? 'var(--accent)' : 'var(--text-secondary)', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ 
                  color: idx === activeQuoteIdx ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: idx === activeQuoteIdx ? 'bold' : 'normal'
                }}>{quote}</span>
              </div>
            ))}
          </div>
        </details>
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
