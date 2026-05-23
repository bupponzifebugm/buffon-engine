import { useState } from 'react';
import { Brain, BookOpen, Quote, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { MINDSET_SHIFTS, THIRTEEN_LESSONS, MINDSET_QUOTES } from '../../lib/constants';

export default function MindsetPanel() {
  // Track which mindset cards are expanded (multiple can be open)
  const [expandedCards, setExpandedCards] = useState({});
  // Track which lesson is open (only one at a time)
  const [openLesson, setOpenLesson] = useState(null);

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
      {/* ── Section 1: Unfuck Ur Mindset ── */}
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

      {/* ── Section 2: The 13 Lessons ── */}
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

      {/* ── Section 3: Mindset Quotes ── */}
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

      {/* ── Section 4: Stockbit vs Ajaib Warning ── */}
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
