import { useState } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function MorningGate({ onSubmit, isCompleted }) {
  const [focusScore, setFocusScore] = useState('');
  const [usdIdr, setUsdIdr] = useState('16800');
  const [macro, setMacro] = useState('green');
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);

  if (isCompleted) return null;

  function handleUnlock() {
    setError('');
    const focus = parseInt(focusScore) || 0;

    if (focus < 1 || focus > 10) {
      setError('Focus score must be between 1 and 10.');
      return;
    }

    if (focus < 7) {
      setBlocked(true);
      setError('CRITICAL FAIL: Focus score below 7. Protocol dictates no trading today. Close everything and rest.');
      return;
    }

    const idrRate = parseInt(usdIdr) || 0;
    if (idrRate < 10000 || idrRate > 25000) {
      setError('USD/IDR rate seems incorrect. Please check and re-enter.');
      return;
    }

    if (macro === 'red') {
      // Show warning but still allow unlock
      alert('⚠️ DEFENSIVE PROTOCOL: Macro is Red. Wait 30 minutes after market open before entering any trades.');
    }

    onSubmit({
      focus_score: focus,
      usd_idr_rate: idrRate,
      macro_env: macro,
    });
  }

  return (
    <div className="modal-overlay open morning-gate-overlay">
      <div className="modal">
        <h3>
          <ShieldCheck size={22} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Morning Gate Protocol
        </h3>
        <p>Complete execution parameters before platform unlocks.</p>

        <div className="field">
          <label>Focus Score (1-10)</label>
          <input
            type="number"
            value={focusScore}
            onChange={e => setFocusScore(e.target.value)}
            min="1"
            max="10"
            placeholder="Be honest with yourself."
            disabled={blocked}
          />
        </div>

        <div className="field">
          <label>USD/IDR Rate (08:30 Check)</label>
          <input
            type="number"
            value={usdIdr}
            onChange={e => setUsdIdr(e.target.value)}
            step="100"
            disabled={blocked}
          />
        </div>

        <div className="field">
          <label>Macro & News Environment</label>
          <select
            value={macro}
            onChange={e => setMacro(e.target.value)}
            disabled={blocked}
          >
            <option value="green">🟢 Green (Clear)</option>
            <option value="mixed">🟡 Mixed (Proceed with caution)</option>
            <option value="red">🔴 Red (Wait 30 mins after open)</option>
          </select>
        </div>

        {error && (
          <div className={blocked ? 'gate-blocked' : 'calc-alert danger'}>
            {blocked ? <ShieldAlert size={18} /> : <AlertTriangle size={16} />}
            <span>{error}</span>
          </div>
        )}

        {!blocked && (
          <button className="btn" onClick={handleUnlock}>
            Unlock Engine
          </button>
        )}

        {blocked && (
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Platform is locked for today. Come back tomorrow with a clear mind.
          </div>
        )}
      </div>
    </div>
  );
}
