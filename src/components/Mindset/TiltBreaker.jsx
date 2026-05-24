import React, { useState, useEffect } from 'react';
import { ShieldAlert, Wind, Activity, CheckCircle2 } from 'lucide-react';

export default function TiltBreaker() {
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Breathing, 2: Assessment, 3: Cooldown
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval = null;
    if (step === 1 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (step === 1 && timer === 0) {
      setStep(2); // Move to assessment after breathing
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  function handleActivate() {
    setIsActive(true);
    setStep(1);
    setTimer(30); // 30 seconds of forced breathing
  }

  function handleCancel() {
    setIsActive(false);
    setStep(0);
  }

  if (!isActive) {
    return (
      <div className="card" style={{ border: '1px solid var(--danger)', background: 'var(--danger-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} />
              EMERGENCY TILT BREAKER
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              Feeling the urge to revenge trade? FOMO kicking in? Press this to lock your execution and cool down.
            </p>
          </div>
          <button 
            onClick={handleActivate}
            style={{
              background: 'var(--danger)',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 6,
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite'
            }}
          >
            PULL LEVER
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ border: '2px solid var(--danger)', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--bg-tertiary)'
      }}>
        {step === 1 && (
          <div style={{
            height: '100%',
            background: 'var(--danger)',
            width: `${(timer / 30) * 100}%`,
            transition: 'width 1s linear'
          }} />
        )}
      </div>

      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <Wind size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px', animation: timer % 6 < 3 ? 'pulse 3s infinite' : 'none' }} />
            <h3 style={{ fontSize: 24, marginBottom: 8, color: 'var(--text-primary)' }}>
              {timer % 6 > 2 ? 'Breathe Out...' : 'Breathe In...'}
            </h3>
            <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
              00:{timer.toString().padStart(2, '0')}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 16 }}>
              Step away from the chart. Close your eyes. Do not place a trade right now.
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'left' }}>
            <Activity size={32} style={{ color: 'var(--accent)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, marginBottom: 12, color: 'var(--text-primary)' }}>Diagnostic Check</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                "Am I trying to 'make back' a loss?",
                "Is this trade part of my plan, or am I forcing it?",
                "Am I feeling physically tense or frustrated?"
              ].map((q, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-tertiary)', padding: 12, borderRadius: 6, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{q}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <button 
                onClick={() => setStep(3)}
                style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', padding: 10, borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                I acknowledge my state
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--success)' }}>Mindset Reset Complete</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Remember, cash is a position. Protecting your capital is more important than catching the next move.
            </p>
            <button 
              onClick={handleCancel}
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
