import { useState, useEffect } from 'react';
import { Moon, Plus, Trash2, ChevronDown, ChevronUp, Target, Calendar, Edit3, Check, X, Zap, Bell, BellOff, Eye } from 'lucide-react';

// ─── SHARED CONSTANTS ───────────────────────────────────────
const SETUP_TYPES = [
  'Breakout', 'Breakdown', 'Support Bounce', 'Resistance Rejection',
  'Accumulation Entry', 'Remora Follow', 'Gap Fill', 'VWAP Reclaim',
  'Smart Money Trail', 'Other'
];
const CONFIDENCE_LEVELS = [
  { label: 'A+ Setup', value: 'A+', color: '#22c55e' },
  { label: 'B Setup',  value: 'B',  color: '#eab308' },
  { label: 'Speculative', value: 'C', color: '#f97316' },
];

// ─── NIGHT PLAN HELPERS ──────────────────────────────────────
const emptyPlan = () => ({
  id: Math.random().toString(36).substring(2, 9),
  ticker: '', setupType: '', entryZone: '', stopLoss: '',
  tp1: '', tp2: '', confidence: 'B', thesis: '', brokerFlow: '',
  createdAt: new Date().toISOString(),
  date: new Date().toISOString().split('T')[0],
  executed: false, skipped: false,
});

// ─── WATCHLIST HELPERS ───────────────────────────────────────
const emptyWatch = () => ({
  id: Math.random().toString(36).substring(2, 9),
  ticker: '',
  targetPrice: '',   // the "bottom" entry price
  stopLoss: '',
  tp1: '',
  tp2: '',
  reason: '',        // why this level matters
  brokerFlow: '',
  status: 'watching', // 'watching' | 'triggered' | 'passed'
  createdAt: new Date().toISOString(),
});

// ──────────────────────────────────────────────────────────────
// NIGHT PLAN CARD
// ──────────────────────────────────────────────────────────────
function PlanCard({ plan, onDelete, onEdit, onToggleExecuted, onToggleSkipped, isToday }) {
  const [expanded, setExpanded] = useState(isToday);
  const conf = CONFIDENCE_LEVELS.find(c => c.value === plan.confidence) || CONFIDENCE_LEVELS[1];
  const riskReward = (() => {
    const entry = parseFloat(plan.entryZone);
    const sl = parseFloat(plan.stopLoss);
    const tp1 = parseFloat(plan.tp1);
    if (!entry || !sl || !tp1 || sl >= entry) return null;
    return ((tp1 - entry) / (entry - sl)).toFixed(1);
  })();

  return (
    <div style={{
      background: plan.executed ? 'rgba(34,197,94,0.05)' : plan.skipped ? 'rgba(100,100,100,0.05)' : 'var(--bg-secondary)',
      border: `1px solid ${plan.executed ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
      borderLeft: `3px solid ${conf.color}`,
      borderRadius: 12, overflow: 'hidden', opacity: plan.skipped ? 0.55 : 1, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', gap: 12 }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{plan.ticker || '???'}</span>
          <span style={{ background: `${conf.color}22`, color: conf.color, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{conf.label}</span>
          {plan.setupType && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{plan.setupType}</span>}
          {riskReward && <span style={{ color: riskReward >= 2 ? '#22c55e' : '#f97316', fontSize: 12, fontWeight: 600 }}>R:R {riskReward}x</span>}
          {plan.executed && <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>✓ Executed</span>}
          {plan.skipped && <span style={{ background: 'rgba(100,100,100,0.15)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>Skipped</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onToggleExecuted(plan.id)} title="Mark Executed" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: plan.executed ? '#22c55e' : 'var(--text-secondary)', padding: 4 }}><Check size={15} /></button>
          <button onClick={() => onToggleSkipped(plan.id)} title="Mark Skipped" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><X size={15} /></button>
          <button onClick={() => onEdit(plan)} title="Edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><Edit3 size={15} /></button>
          <button onClick={() => onDelete(plan.id)} title="Delete" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}><Trash2 size={15} /></button>
          {expanded ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
            {[
              { label: 'Entry Zone', value: plan.entryZone, color: '#60a5fa' },
              { label: 'Stop Loss',  value: plan.stopLoss,  color: '#ef4444' },
              { label: 'TP1 (40%)', value: plan.tp1,       color: '#22c55e' },
              { label: 'TP2 (Full)',value: plan.tp2,       color: '#a3e635' },
            ].filter(f => f.value).map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
          {plan.thesis && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>📝 THESIS</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{plan.thesis}</div>
            </div>
          )}
          {plan.brokerFlow && (
            <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: 8, padding: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div style={{ fontSize: 11, color: '#a855f7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={11} /> BROKER FLOW / BANDAR NOTE</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{plan.brokerFlow}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// NIGHT PLAN FORM
// ──────────────────────────────────────────────────────────────
function PlanForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyPlan());
  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>🌙 {initial?.ticker ? `Editing ${initial.ticker}` : 'New Night Plan'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { field: 'ticker', label: 'TICKER *', placeholder: 'BBCA', upper: true, type: 'text' },
        ].map(({ field, label, placeholder, upper, type }) => (
          <div key={field}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input value={form[field]} onChange={e => set(field, upper ? e.target.value.toUpperCase() : e.target.value)} placeholder={placeholder} type={type}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, letterSpacing: 1, boxSizing: 'border-box' }} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DATE</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>CONFIDENCE</label>
          <select value={form.confidence} onChange={e => set('confidence', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}>
            {CONFIDENCE_LEVELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SETUP TYPE</label>
        <select value={form.setupType} onChange={e => set('setupType', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}>
          <option value="">Select setup...</option>
          {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { field: 'entryZone', label: 'ENTRY ZONE', placeholder: '4500' },
          { field: 'stopLoss',  label: 'STOP LOSS',  placeholder: '4300' },
          { field: 'tp1',      label: 'TP1 (40%)',  placeholder: '4800' },
          { field: 'tp2',      label: 'TP2 (Full)', placeholder: '5200' },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input type="number" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>WHY THIS TRADE? (THESIS)</label>
        <textarea value={form.thesis} onChange={e => set('thesis', e.target.value)} rows={3} placeholder="Broker CC accumulating. VWAP support held 3 days..."
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
      </div>
      <div>
        <label style={{ fontSize: 11, color: '#a855f7', display: 'block', marginBottom: 4 }}>🐋 BANDAR / BROKER FLOW NOTE</label>
        <input value={form.brokerFlow} onChange={e => set('brokerFlow', e.target.value)} placeholder="CC net buy +500 lots at 4450. ZP exiting..."
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={() => { if (form.ticker) onSave(form); }} disabled={!form.ticker}
          style={{ flex: 2, padding: '10px', background: form.ticker ? 'var(--accent)' : 'var(--border)', border: 'none', borderRadius: 8, color: '#fff', cursor: form.ticker ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}>
          Save Plan
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PRICE WATCHLIST CARD
// ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  watching:  { label: '👀 Watching',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
  triggered: { label: '⚡ Triggered', color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)'  },
  passed:    { label: '🚫 Passed',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.3)' },
};

function WatchCard({ watch, onDelete, onEdit, onSetStatus }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_CONFIG[watch.status] || STATUS_CONFIG.watching;

  const rr = (() => {
    const entry = parseFloat(watch.targetPrice);
    const sl = parseFloat(watch.stopLoss);
    const tp1 = parseFloat(watch.tp1);
    if (!entry || !sl || !tp1 || sl >= entry) return null;
    return ((tp1 - entry) / (entry - sl)).toFixed(1);
  })();

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${s.border}`,
      borderLeft: `3px solid ${s.color}`,
      borderRadius: 12, overflow: 'hidden',
      opacity: watch.status === 'passed' ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', gap: 12 }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>{watch.ticker || '???'}</span>
          {watch.targetPrice && (
            <span style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', padding: '3px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              🎯 {watch.targetPrice}
            </span>
          )}
          {rr && <span style={{ color: rr >= 2 ? '#22c55e' : '#f97316', fontSize: 12, fontWeight: 600 }}>R:R {rr}x</span>}
          <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${s.border}` }}>{s.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
          {/* Status cycle buttons */}
          <button onClick={() => onSetStatus(watch.id, 'triggered')} title="Mark Triggered (Price Hit!)" style={{ background: watch.status === 'triggered' ? 'rgba(34,197,94,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#22c55e', padding: 4, borderRadius: 6 }}><Bell size={14} /></button>
          <button onClick={() => onSetStatus(watch.id, 'passed')} title="Mark Passed (Missed It)" style={{ background: watch.status === 'passed' ? 'rgba(107,114,128,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, borderRadius: 6 }}><BellOff size={14} /></button>
          <button onClick={() => onSetStatus(watch.id, 'watching')} title="Back to Watching" style={{ background: watch.status === 'watching' ? 'rgba(96,165,250,0.15)' : 'transparent', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: 4, borderRadius: 6 }}><Eye size={14} /></button>
          <button onClick={() => onEdit(watch)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}><Edit3 size={14} /></button>
          <button onClick={() => onDelete(watch.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}><Trash2 size={14} /></button>
          {expanded ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Price levels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {[
              { label: 'Target Entry', value: watch.targetPrice, color: '#60a5fa' },
              { label: 'Stop Loss',    value: watch.stopLoss,    color: '#ef4444' },
              { label: 'TP1 (40%)',   value: watch.tp1,         color: '#22c55e' },
              { label: 'TP2 (Full)',  value: watch.tp2,         color: '#a3e635' },
            ].filter(f => f.value).map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Reason */}
          {watch.reason && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>💡 WHY THIS LEVEL?</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{watch.reason}</div>
            </div>
          )}

          {/* Broker flow */}
          {watch.brokerFlow && (
            <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: 8, padding: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div style={{ fontSize: 11, color: '#a855f7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={11} /> BROKER FLOW / BANDAR NOTE</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{watch.brokerFlow}</div>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Added {new Date(watch.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PRICE WATCHLIST FORM
// ──────────────────────────────────────────────────────────────
function WatchForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyWatch());
  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#60a5fa' }}>🎯 {initial?.ticker ? `Editing ${initial.ticker}` : 'New Price Alert'}</div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TICKER *</label>
          <input value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} placeholder="BBRI"
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, letterSpacing: 1, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#60a5fa', display: 'block', marginBottom: 4 }}>🎯 TARGET ENTRY PRICE *</label>
          <input type="number" value={form.targetPrice} onChange={e => set('targetPrice', e.target.value)} placeholder="e.g. 4500 — the bottom you're waiting for"
            style={{ width: '100%', padding: '8px 10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, color: '#60a5fa', fontSize: 14, fontWeight: 700, boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { field: 'stopLoss', label: 'STOP LOSS', placeholder: '4300' },
          { field: 'tp1',     label: 'TP1 (40%)', placeholder: '4800' },
          { field: 'tp2',     label: 'TP2 (Full)', placeholder: '5200' },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input type="number" value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>

      <div>
        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>WHY THIS PRICE LEVEL?</label>
        <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
          placeholder="Strong support at 4500. Previous accumulation zone. Bandar last bought here in March. VWAP weekly sits at 4480..."
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
      </div>

      <div>
        <label style={{ fontSize: 11, color: '#a855f7', display: 'block', marginBottom: 4 }}>🐋 BANDAR / BROKER FLOW NOTE</label>
        <input value={form.brokerFlow} onChange={e => set('brokerFlow', e.target.value)} placeholder="Last seen accumulating here. CC bottom fishing..."
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={() => { if (form.ticker && form.targetPrice) onSave(form); }} disabled={!form.ticker || !form.targetPrice}
          style={{ flex: 2, padding: '10px', background: (form.ticker && form.targetPrice) ? '#2563eb' : 'var(--border)', border: 'none', borderRadius: 8, color: '#fff', cursor: (form.ticker && form.targetPrice) ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}>
          Save Price Alert
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────
export default function NightPlanner() {
  const [slide, setSlide] = useState('plan'); // 'plan' | 'watch'

  // Night Plans state
  const [plans, setPlans] = useState(() => JSON.parse(localStorage.getItem('buffon_night_plans') || '[]'));
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Watchlist state
  const [watches, setWatches] = useState(() => JSON.parse(localStorage.getItem('buffon_price_watches') || '[]'));
  const [showWatchForm, setShowWatchForm] = useState(false);
  const [editingWatch, setEditingWatch] = useState(null);

  useEffect(() => { localStorage.setItem('buffon_night_plans', JSON.stringify(plans)); }, [plans]);
  useEffect(() => { localStorage.setItem('buffon_price_watches', JSON.stringify(watches)); }, [watches]);

  // Plan handlers
  function handleSavePlan(form) {
    if (editingPlan) { setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...form, id: editingPlan.id } : p)); setEditingPlan(null); }
    else { setPlans(prev => [form, ...prev]); setShowPlanForm(false); }
  }
  function handleEditPlan(plan) { setEditingPlan(plan); setShowPlanForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function handleDeletePlan(id) { if (confirm('Delete this plan?')) setPlans(prev => prev.filter(p => p.id !== id)); }
  function toggleExecuted(id) { setPlans(prev => prev.map(p => p.id === id ? { ...p, executed: !p.executed, skipped: false } : p)); }
  function toggleSkipped(id) { setPlans(prev => prev.map(p => p.id === id ? { ...p, skipped: !p.skipped, executed: false } : p)); }

  // Watch handlers
  function handleSaveWatch(form) {
    if (editingWatch) { setWatches(prev => prev.map(w => w.id === editingWatch.id ? { ...form, id: editingWatch.id } : w)); setEditingWatch(null); }
    else { setWatches(prev => [form, ...prev]); setShowWatchForm(false); }
  }
  function handleEditWatch(watch) { setEditingWatch(watch); setShowWatchForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function handleDeleteWatch(id) { if (confirm('Delete this price alert?')) setWatches(prev => prev.filter(w => w.id !== id)); }
  function handleSetStatus(id, status) { setWatches(prev => prev.map(w => w.id === id ? { ...w, status } : w)); }

  const todayStr = new Date().toISOString().split('T')[0];

  // Group plans by date
  const grouped = plans.reduce((acc, p) => {
    const d = p.date || todayStr;
    if (!acc[d]) acc[d] = [];
    acc[d].push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayPlans = grouped[todayStr] || [];
  const todayExecuted = todayPlans.filter(p => p.executed).length;

  // Watchlist splits
  const watchingList  = watches.filter(w => w.status === 'watching');
  const triggeredList = watches.filter(w => w.status === 'triggered');
  const passedList    = watches.filter(w => w.status === 'passed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

      {/* ── Slide Toggle ── */}
      <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, gap: 4 }}>
        {[
          { key: 'plan',  label: '🌙 Tonight\'s Plan', desc: 'Tomorrow\'s ready-to-execute trades' },
          { key: 'watch', label: '🎯 Price Watchlist',  desc: 'Waiting for price to drop to my level' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSlide(tab.key)}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: slide === tab.key ? (tab.key === 'plan' ? 'rgba(168,85,247,0.15)' : 'rgba(37,99,235,0.15)') : 'transparent',
              color: slide === tab.key ? (tab.key === 'plan' ? '#c084fc' : '#60a5fa') : 'var(--text-secondary)',
              fontWeight: slide === tab.key ? 700 : 500,
              fontSize: 14, transition: 'all 0.2s',
              outline: slide === tab.key ? `1px solid ${tab.key === 'plan' ? 'rgba(168,85,247,0.4)' : 'rgba(37,99,235,0.4)'}` : 'none',
            }}
          >
            <div>{tab.label}</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════ */}
      {/* SLIDE 1: TONIGHT'S PLAN             */}
      {/* ════════════════════════════════════ */}
      {slide === 'plan' && (
        <>
          {/* Header */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Moon size={20} style={{ color: '#c084fc' }} />
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e9d5ff' }}>Tonight's Plan</h2>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#a78bfa', lineHeight: 1.6, maxWidth: 480 }}>
                  Plan tomorrow's trades tonight while your head is clear. Pre-planned setups are your <strong>priority</strong>.
                  If a new setup shows up during the session, add it on the fly — no restrictions.
                </p>
              </div>
              {todayPlans.length > 0 && (
                <div style={{ textAlign: 'center', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: '12px 20px', minWidth: 100 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#c084fc' }}>{todayExecuted}/{todayPlans.length}</div>
                  <div style={{ fontSize: 11, color: '#a78bfa' }}>Today Executed</div>
                </div>
              )}
            </div>
            {todayPlans.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Today:</span>
                {todayPlans.map(p => {
                  const conf = CONFIDENCE_LEVELS.find(c => c.value === p.confidence);
                  return (
                    <span key={p.id} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: p.executed ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)', color: p.executed ? '#4ade80' : conf?.color || '#c084fc', border: `1px solid ${p.executed ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.2)'}`, textDecoration: p.skipped ? 'line-through' : 'none' }}>
                      {p.ticker}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {editingPlan && <PlanForm initial={editingPlan} onSave={handleSavePlan} onCancel={() => setEditingPlan(null)} />}
          {showPlanForm && !editingPlan && <PlanForm onSave={handleSavePlan} onCancel={() => setShowPlanForm(false)} />}
          {!showPlanForm && !editingPlan && (
            <button onClick={() => setShowPlanForm(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'transparent', border: '1px dashed rgba(168,85,247,0.5)', borderRadius: 12, color: '#a855f7', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Plus size={16} /> Add Trade Plan
            </button>
          )}

          {sortedDates.length === 0 && !showPlanForm && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <Moon size={40} style={{ color: 'rgba(168,85,247,0.3)', marginBottom: 16 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No plans yet</div>
              <div style={{ fontSize: 13 }}>The night before is when battles are won. Add your first plan above.</div>
            </div>
          )}

          {sortedDates.map(date => {
            const datePlans = grouped[date];
            const isToday = date === todayStr;
            const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#c084fc' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, background: isToday ? 'rgba(168,85,247,0.1)' : 'transparent', padding: isToday ? '3px 10px' : '3px 4px', borderRadius: 20, border: isToday ? '1px solid rgba(168,85,247,0.3)' : 'none' }}>
                    {isToday ? `⟡ TODAY — ${displayDate}` : displayDate}
                  </span>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {datePlans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} onDelete={handleDeletePlan} onEdit={handleEditPlan} onToggleExecuted={toggleExecuted} onToggleSkipped={toggleSkipped} isToday={isToday} />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ════════════════════════════════════ */}
      {/* SLIDE 2: PRICE WATCHLIST            */}
      {/* ════════════════════════════════════ */}
      {slide === 'watch' && (
        <>
          {/* Header */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #0a1628, #0c1f4a, #0d1d3e)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Target size={20} style={{ color: '#60a5fa' }} />
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#bfdbfe' }}>Price Watchlist</h2>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#93c5fd', lineHeight: 1.6, maxWidth: 500 }}>
                  Stocks you want to buy — but only when price drops to <em>your level</em>. No time pressure.
                  Set your target price, write your thesis, and wait patiently. Hengky says: bid at the bottom.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Watching', count: watchingList.length, color: '#60a5fa' },
                  { label: 'Triggered', count: triggeredList.length, color: '#22c55e' },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ textAlign: 'center', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 12, padding: '10px 16px', minWidth: 70 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color }}>{count}</div>
                    <div style={{ fontSize: 11, color: '#93c5fd' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Watching quick chips */}
            {watchingList.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={11} /> Waiting on:</span>
                {watchingList.map(w => (
                  <span key={w.id} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                    {w.ticker} @ {w.targetPrice}
                  </span>
                ))}
              </div>
            )}
          </div>

          {editingWatch && <WatchForm initial={editingWatch} onSave={handleSaveWatch} onCancel={() => setEditingWatch(null)} />}
          {showWatchForm && !editingWatch && <WatchForm onSave={handleSaveWatch} onCancel={() => setShowWatchForm(false)} />}
          {!showWatchForm && !editingWatch && (
            <button onClick={() => setShowWatchForm(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'transparent', border: '1px dashed rgba(37,99,235,0.5)', borderRadius: 12, color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Plus size={16} /> Add Price Alert
            </button>
          )}

          {watches.length === 0 && !showWatchForm && (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <Target size={40} style={{ color: 'rgba(37,99,235,0.3)', marginBottom: 16 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No price alerts yet</div>
              <div style={{ fontSize: 13 }}>Add stocks you're patiently waiting to buy at the right price.</div>
            </div>
          )}

          {/* Active watches */}
          {watchingList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(96,165,250,0.1)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(96,165,250,0.3)' }}>👀 Watching ({watchingList.length})</span>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {watchingList.map(w => <WatchCard key={w.id} watch={w} onDelete={handleDeleteWatch} onEdit={handleEditWatch} onSetStatus={handleSetStatus} />)}
              </div>
            </div>
          )}

          {/* Triggered */}
          {triggeredList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8 }}>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, background: 'rgba(34,197,94,0.1)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.3)' }}>⚡ Triggered — Price Hit! ({triggeredList.length})</span>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {triggeredList.map(w => <WatchCard key={w.id} watch={w} onDelete={handleDeleteWatch} onEdit={handleEditWatch} onSetStatus={handleSetStatus} />)}
              </div>
            </div>
          )}

          {/* Passed / Archived */}
          {passedList.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8 }}>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>🚫 Passed / Archived ({passedList.length})</span>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {passedList.map(w => <WatchCard key={w.id} watch={w} onDelete={handleDeleteWatch} onEdit={handleEditWatch} onSetStatus={handleSetStatus} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
