import { useState, useEffect } from 'react';
import { Moon, Plus, Trash2, ChevronDown, ChevronUp, Target, TrendingUp, AlertTriangle, Calendar, Edit3, Check, X, Zap } from 'lucide-react';

const SETUP_TYPES = [
  'Breakout', 'Breakdown', 'Support Bounce', 'Resistance Rejection',
  'Accumulation Entry', 'Remora Follow', 'Gap Fill', 'VWAP Reclaim',
  'Smart Money Trail', 'Other'
];

const CONFIDENCE_LEVELS = [
  { label: 'A+ Setup', value: 'A+', color: '#22c55e' },
  { label: 'B Setup', value: 'B', color: '#eab308' },
  { label: 'Speculative', value: 'C', color: '#f97316' },
];

const emptyPlan = () => ({
  id: Math.random().toString(36).substring(2, 9),
  ticker: '',
  setupType: '',
  entryZone: '',
  stopLoss: '',
  tp1: '',
  tp2: '',
  confidence: 'B',
  thesis: '',
  brokerFlow: '',
  createdAt: new Date().toISOString(),
  date: new Date().toISOString().split('T')[0],
  executed: false,
  skipped: false,
});

function PlanCard({ plan, onDelete, onEdit, onToggleExecuted, onToggleSkipped, isToday }) {
  const [expanded, setExpanded] = useState(isToday);

  const conf = CONFIDENCE_LEVELS.find(c => c.value === plan.confidence) || CONFIDENCE_LEVELS[1];

  const riskReward = (() => {
    const entry = parseFloat(plan.entryZone);
    const sl = parseFloat(plan.stopLoss);
    const tp1 = parseFloat(plan.tp1);
    if (!entry || !sl || !tp1 || sl >= entry) return null;
    const risk = entry - sl;
    const reward = tp1 - entry;
    return (reward / risk).toFixed(1);
  })();

  return (
    <div style={{
      background: plan.executed ? 'rgba(34,197,94,0.05)' : plan.skipped ? 'rgba(100,100,100,0.05)' : 'var(--bg-secondary)',
      border: `1px solid ${plan.executed ? 'rgba(34,197,94,0.3)' : plan.skipped ? 'var(--border)' : 'var(--border)'}`,
      borderLeft: `3px solid ${conf.color}`,
      borderRadius: 12,
      overflow: 'hidden',
      opacity: plan.skipped ? 0.55 : 1,
      transition: 'all 0.2s',
    }}>
      {/* Header row */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', gap: 12 }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>{plan.ticker || '???'}</span>
          <span style={{ background: `${conf.color}22`, color: conf.color, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{conf.label}</span>
          {plan.setupType && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{plan.setupType}</span>}
          {riskReward && <span style={{ color: riskReward >= 2 ? '#22c55e' : '#f97316', fontSize: 12, fontWeight: 600 }}>R:R {riskReward}x</span>}
          {plan.executed && <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>✓ Executed</span>}
          {plan.skipped && <span style={{ background: 'rgba(100,100,100,0.15)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>Skipped</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onToggleExecuted(plan.id)} title="Mark Executed" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: plan.executed ? '#22c55e' : 'var(--text-secondary)', padding: 4 }}>
            <Check size={15} />
          </button>
          <button onClick={() => onToggleSkipped(plan.id)} title="Mark Skipped" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: plan.skipped ? 'var(--text-secondary)' : 'var(--text-secondary)', padding: 4 }}>
            <X size={15} />
          </button>
          <button onClick={() => onEdit(plan)} title="Edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
            <Edit3 size={15} />
          </button>
          <button onClick={() => onDelete(plan.id)} title="Delete" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
            <Trash2 size={15} />
          </button>
          {expanded ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Price levels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
            {[
              { label: 'Entry Zone', value: plan.entryZone, color: '#60a5fa' },
              { label: 'Stop Loss', value: plan.stopLoss, color: '#ef4444' },
              { label: 'TP1 (40%)', value: plan.tp1, color: '#22c55e' },
              { label: 'TP2 (Full)', value: plan.tp2, color: '#a3e635' },
            ].map(({ label, value, color }) => value ? (
              <div key={label} style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
              </div>
            ) : null)}
          </div>

          {/* Thesis */}
          {plan.thesis && (
            <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Target size={11} /> THESIS
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{plan.thesis}</div>
            </div>
          )}

          {/* Broker Flow */}
          {plan.brokerFlow && (
            <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: 8, padding: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div style={{ fontSize: 11, color: '#a855f7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={11} /> BROKER FLOW / BANDAR NOTE
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{plan.brokerFlow}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || emptyPlan());

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Target size={14} /> {initial?.ticker ? `Editing ${initial.ticker}` : 'Add New Plan'}
      </div>

      {/* Row 1: Ticker, Date, Confidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>TICKER *</label>
          <input
            value={form.ticker}
            onChange={e => set('ticker', e.target.value.toUpperCase())}
            placeholder="BBCA"
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, letterSpacing: 1, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DATE</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>CONFIDENCE</label>
          <select
            value={form.confidence}
            onChange={e => set('confidence', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
          >
            {CONFIDENCE_LEVELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Setup type */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SETUP TYPE</label>
        <select
          value={form.setupType}
          onChange={e => set('setupType', e.target.value)}
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
        >
          <option value="">Select setup...</option>
          {SETUP_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Price levels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { field: 'entryZone', label: 'ENTRY ZONE', placeholder: '4500' },
          { field: 'stopLoss', label: 'STOP LOSS', placeholder: '4300' },
          { field: 'tp1', label: 'TP1 (40%)', placeholder: '4800' },
          { field: 'tp2', label: 'TP2 (Full)', placeholder: '5200' },
        ].map(({ field, label, placeholder }) => (
          <div key={field}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input
              type="number"
              value={form[field]}
              onChange={e => set(field, e.target.value)}
              placeholder={placeholder}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      {/* Thesis */}
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>WHY THIS TRADE? (THESIS)</label>
        <textarea
          value={form.thesis}
          onChange={e => set('thesis', e.target.value)}
          placeholder="Broker CC accumulating below 4500. Owner Pemerintah pushing infrastructure narrative. VWAP support held 3 days..."
          rows={3}
          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
        />
      </div>

      {/* Broker Flow */}
      <div>
        <label style={{ fontSize: 11, color: '#a855f7', display: 'block', marginBottom: 4 }}>🐋 BANDAR / BROKER FLOW NOTE</label>
        <input
          value={form.brokerFlow}
          onChange={e => set('brokerFlow', e.target.value)}
          placeholder="CC net buy +500 lots at 4450. ZP exiting. Smart money signal..."
          style={{ width: '100%', padding: '8px 10px', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          onClick={() => { if (form.ticker) { onSave(form); } }}
          disabled={!form.ticker}
          style={{ flex: 2, padding: '10px', background: form.ticker ? 'var(--accent)' : 'var(--border)', border: 'none', borderRadius: 8, color: '#fff', cursor: form.ticker ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14 }}
        >
          Save Plan
        </button>
      </div>
    </div>
  );
}

export default function NightPlanner() {
  const [plans, setPlans] = useState(() => JSON.parse(localStorage.getItem('buffon_night_plans') || '[]'));
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem('buffon_night_plans', JSON.stringify(plans));
  }, [plans]);

  function handleSave(form) {
    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...form, id: editingPlan.id } : p));
      setEditingPlan(null);
    } else {
      setPlans(prev => [form, ...prev]);
      setShowForm(false);
    }
  }

  function handleEdit(plan) {
    setEditingPlan(plan);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDelete(id) {
    if (confirm('Delete this plan?')) {
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  }

  function toggleExecuted(id) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, executed: !p.executed, skipped: false } : p));
  }

  function toggleSkipped(id) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, skipped: !p.skipped, executed: false } : p));
  }

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
  const todayTotal = todayPlans.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', border: '1px solid rgba(168,85,247,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Moon size={20} style={{ color: '#c084fc' }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e9d5ff' }}>Night Planner</h2>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#a78bfa', lineHeight: 1.6, maxWidth: 480 }}>
              Plan your trades the night before, when your head is clear and the market is closed. 
              Pre-planned setups are your <strong>priority</strong>. But if you spot a valid setup during the session, log it on the fly — no restrictions.
            </p>
          </div>
          {todayTotal > 0 && (
            <div style={{ textAlign: 'center', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: '12px 20px', minWidth: 100 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#c084fc' }}>{todayExecuted}/{todayTotal}</div>
              <div style={{ fontSize: 11, color: '#a78bfa' }}>Today Executed</div>
            </div>
          )}
        </div>

        {/* Today's plans as quick chips */}
        {todayPlans.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> Today's watchlist:
            </span>
            {todayPlans.map(p => {
              const conf = CONFIDENCE_LEVELS.find(c => c.value === p.confidence);
              return (
                <span key={p.id} style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: p.executed ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.15)',
                  color: p.executed ? '#4ade80' : conf?.color || '#c084fc',
                  border: `1px solid ${p.executed ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.2)'}`,
                  textDecoration: p.skipped ? 'line-through' : 'none',
                }}>
                  {p.ticker}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Form */}
      {editingPlan && (
        <PlanForm
          initial={editingPlan}
          onSave={handleSave}
          onCancel={() => setEditingPlan(null)}
        />
      )}
      {showForm && !editingPlan && (
        <PlanForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Add Button */}
      {!showForm && !editingPlan && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', background: 'transparent',
            border: '1px dashed rgba(168,85,247,0.5)', borderRadius: 12,
            color: '#a855f7', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Plus size={16} /> Add Trade Plan
        </button>
      )}

      {/* Plans grouped by date */}
      {sortedDates.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Moon size={40} style={{ color: 'rgba(168,85,247,0.3)', marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No plans yet</div>
          <div style={{ fontSize: 13 }}>
            The night before is when battles are won. Add your first plan above.
          </div>
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
              <span style={{
                fontSize: 11, fontWeight: 700, color: isToday ? '#c084fc' : 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: 1,
                background: isToday ? 'rgba(168,85,247,0.1)' : 'transparent',
                padding: isToday ? '3px 10px' : '3px 4px',
                borderRadius: 20,
                border: isToday ? '1px solid rgba(168,85,247,0.3)' : 'none',
              }}>
                {isToday ? `⟡ TODAY — ${displayDate}` : displayDate}
              </span>
              <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {datePlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onToggleExecuted={toggleExecuted}
                  onToggleSkipped={toggleSkipped}
                  isToday={isToday}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
