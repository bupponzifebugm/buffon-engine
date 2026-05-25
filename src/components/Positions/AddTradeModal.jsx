import { useState, useEffect, useMemo } from 'react';
import { getTodayString } from '../../lib/utils';
import { EMOTIONS, calcRR } from '../../lib/constants';

export default function AddTradeModal({ isOpen, onClose, onSave, prefill, gamificationState }) {
  const [ticker, setTicker] = useState(prefill?.ticker || '');
  const [lots, setLots] = useState(prefill?.lots || '');
  const [entryPrice, setEntryPrice] = useState(prefill?.entry_price || '');
  const [slPrice, setSlPrice] = useState(prefill?.sl_price || '');
  const [tp1Price, setTp1Price] = useState(prefill?.tp1_price || '');
  const [tp2Price, setTp2Price] = useState(prefill?.tp2_price || '');
  const [status, setStatus] = useState('closed');
  const [exitPrice, setExitPrice] = useState('');
  const [emotion, setEmotion] = useState('calm');
  const [isViolation, setIsViolation] = useState(false);
  const [violationReason, setViolationReason] = useState('');

  // Process Score checkboxes
  const [procSetup, setProcSetup] = useState(true);
  const [procExecution, setProcExecution] = useState(true);
  const [procRisk, setProcRisk] = useState(true);

  const processScore = Math.round(([procSetup, procExecution, procRisk].filter(Boolean).length / 3) * 100);

  // Reset form when prefill changes
  useEffect(() => {
    if (prefill) {
      setTicker(prefill.ticker || '');
      setLots(prefill.lots || '');
      setEntryPrice(prefill.entry_price || '');
      setSlPrice(prefill.sl_price || '');
      setTp1Price(prefill.tp1_price || '');
      setTp2Price(prefill.tp2_price || '');
      setStatus(prefill.status || 'open');
      setExitPrice(prefill.exit_price || '');
      setEmotion(prefill.emotion || 'calm');
      setIsViolation(prefill.is_violation || false);
      setViolationReason(prefill.violation_reason || '');
      setProcSetup(true);
      setProcExecution(true);
      setProcRisk(true);
    } else {
      setTicker('');
      setLots('');
      setEntryPrice('');
      setSlPrice('');
      setTp1Price('');
      setTp2Price('');
      setStatus('open');
      setExitPrice('');
      setEmotion('calm');
      setIsViolation(false);
      setViolationReason('');
      setProcSetup(false);
      setProcExecution(false);
      setProcRisk(false);
    }
  }, [prefill]);

  if (!isOpen) return null;

  function handleSave() {
    const t = ticker.trim().toUpperCase();
    const l = parseInt(lots) || 0;
    const e = parseFloat(entryPrice) || 0;
    const s = parseFloat(slPrice) || 0;

    if (!t || !l || !e || !s) {
      alert('Lengkapi Ticker, Lot, Entry, dan SL.');
      return;
    }

    const t1 = parseFloat(tp1Price) || 0;
    const t2 = parseFloat(tp2Price) || 0;
    const ex = parseFloat(exitPrice) || 0;

    let pnl = 0;
    if (status === 'closed' && ex) pnl = (ex - e) * l * 100;
    else if (status === 'sl') pnl = (s - e) * l * 100;
    else if (status === 'tp1') pnl = (t1 - e) * (l * 0.4) * 100;

    const roundedPnl = Math.round(pnl);
    const rrResult = (status !== 'open') ? calcRR(processScore, roundedPnl) : null;

    onSave({
      ticker: t,
      lots: l,
      entry_price: e,
      sl_price: s,
      tp1_price: t1,
      tp2_price: t2,
      exit_price: ex,
      status,
      pnl: roundedPnl,
      trade_date: getTodayString(),
      emotion,
      is_violation: isViolation,
      violation_reason: isViolation ? violationReason : '',
      process_score: processScore,
      rr_awarded: rrResult ? rrResult.rr : 0,
    });

    onClose();
  }

  const showExit = status === 'closed' || status === 'sl';

  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Log Trade</h3>

        {/* GAMIFICATION STATUS BANNER */}
        {gamificationState && (gamificationState.is_ult_active || gamificationState.is_eco_round) && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: gamificationState.is_ult_active ? 'var(--danger-bg)' : 'var(--success-bg)', border: `1px solid ${gamificationState.is_ult_active ? 'var(--danger)' : 'var(--success)'}` }}>
            {gamificationState.is_ult_active && (
              <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>
                🔥 ULTIMATE ACTIVE: Next WIN gets 2x RR! (Don't waste it on a bad setup)
              </div>
            )}
            {gamificationState.is_eco_round && (
              <div style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700, marginTop: gamificationState.is_ult_active ? 4 : 0 }}>
                🛡️ ECO ROUND ACTIVE: Half your size. Clean execution gets +15 RR bonus.
              </div>
            )}
          </div>
        )}

        <div className="field">
          <label>Ticker</label>
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Lot masuk</label>
            <input type="number" value={lots} onChange={e => setLots(e.target.value)} />
          </div>
          <div className="field">
            <label>Harga masuk (Rp)</label>
            <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Stop Loss (Rp)</label>
            <input type="number" value={slPrice} onChange={e => setSlPrice(e.target.value)} />
          </div>
          <div className="field">
            <label>TP1 (Rp)</label>
            <input type="number" value={tp1Price} onChange={e => setTp1Price(e.target.value)} />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>TP2 (Rp)</label>
            <input type="number" value={tp2Price} onChange={e => setTp2Price(e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="open">Open (SL Active)</option>
              <option value="tp1">TP1 Hit (SL @ BE)</option>
              <option value="closed">Closed (TP2 / Manual)</option>
              <option value="sl">SL Hit</option>
            </select>
          </div>
        </div>

        {showExit && (
          <div className="field">
            <label>Harga Exit Akhir (Rp)</label>
            <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)} />
          </div>
        )}

        {/* ── Emotional State ── */}
        <div className="field">
          <label>Emotional State Saat Entry</label>
          <div className="emotion-grid">
            {EMOTIONS.map(em => (
              <button
                key={em.value}
                type="button"
                className={`emotion-tag${emotion === em.value ? ` active ${em.color}` : ''}`}
                onClick={() => setEmotion(em.value)}
              >
                {em.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Process Score ── */}
        <div className="field">
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
            Process Score
            <span style={{ 
              marginLeft: 8, 
              fontSize: 12, 
              fontWeight: 800, 
              fontFamily: 'var(--font-mono)',
              color: processScore >= 66 ? 'var(--success)' : processScore >= 33 ? 'var(--warning)' : 'var(--danger)',
              background: processScore >= 66 ? 'var(--success-bg)' : processScore >= 33 ? 'var(--warning-bg)' : 'var(--danger-bg)',
              padding: '2px 8px',
              borderRadius: 4
            }}>
              {processScore}%
            </span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { state: procSetup, setter: setProcSetup, label: '🎯 Setup Match — Was this a pre-planned playbook setup?' },
              { state: procExecution, setter: setProcExecution, label: '⚡ Execution — Did I enter/exit without hesitation and respect my exact SL?' },
              { state: procRisk, setter: setProcRisk, label: '🛡️ Risk Control — Was sizing 100% compliant with IDR tier limits?' },
            ].map((item, i) => (
              <label 
                key={i}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${item.state ? 'var(--success)' : 'var(--border)'}`,
                  background: item.state ? 'var(--success-bg)' : 'var(--bg-primary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={e => item.setter(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--success)' }}
                />
                <span style={{ fontSize: 12, color: item.state ? 'var(--success)' : 'var(--text-secondary)', fontWeight: item.state ? 600 : 400 }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Violation Toggle ── */}
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isViolation}
              onChange={e => setIsViolation(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--danger)' }}
            />
            <span style={{ color: isViolation ? 'var(--danger)' : 'var(--text-secondary)' }}>
              ⚠ This trade violated my system rules
            </span>
          </label>
        </div>

        {isViolation && (
          <div className="field">
            <label style={{ color: 'var(--danger)' }}>What rule did you break?</label>
            <textarea
              value={violationReason}
              onChange={e => setViolationReason(e.target.value)}
              placeholder="e.g., Revenge trade, no SL placed, chased entry, not on watchlist..."
              rows={2}
              style={{
                width: '100%',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                padding: '11px 14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn secondary" onClick={onClose} style={{ marginTop: 0 }}>Batal</button>
          <button className="btn" onClick={handleSave} style={{ marginTop: 0 }}>Simpan Posisi</button>
        </div>
      </div>
    </div>
  );
}
