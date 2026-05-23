import { useState } from 'react';
import { Receipt, Trash2, TrendingDown, AlertTriangle } from 'lucide-react';
import { MISTAKE_TYPES, MISTAKE_SOLUTIONS } from '../../lib/constants';
import { fmtRp, fmtDate } from '../../lib/utils';

function getMostCommonMistake(mistakes) {
  if (!mistakes || mistakes.length === 0) return '—';
  const freq = {};
  mistakes.forEach((m) => {
    const t = m.mistake_type || 'Unknown';
    freq[t] = (freq[t] || 0) + 1;
  });
  let maxType = '';
  let maxCount = 0;
  Object.entries(freq).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  });
  return maxType;
}

const EMPTY_FORM = {
  ticker: '',
  mistake_type: '',
  tuition_loss: '',
  notes: '',
  action_plan: '',
};

export default function MistakesLog({ mistakes, onAddMistake, onDeleteMistake }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const totalTuition = (mistakes || []).reduce(
    (sum, m) => sum + (parseFloat(m.tuition_loss) || 0),
    0
  );
  const totalCount = (mistakes || []).length;
  const mostCommon = getMostCommonMistake(mistakes);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.ticker || !form.mistake_type) return;

    onAddMistake({
      ticker: form.ticker.toUpperCase(),
      mistake_type: form.mistake_type,
      tuition_loss: parseFloat(form.tuition_loss) || 0,
      notes: form.notes,
      action_plan: form.action_plan,
      created_at: new Date().toISOString(),
    });

    setForm({ ...EMPTY_FORM });
  }

  return (
    <div className="mistakes-dashboard">
      {/* ── Tuition Dashboard ── */}
      <div className="card">
        <div className="card-title">
          <Receipt size={16} />
          Tuition Dashboard
        </div>
        <div className="tuition-grid">
          <div className="tuition-stat danger">
            <div className="tuition-stat-value">{fmtRp(totalTuition)}</div>
            <div className="tuition-stat-label">Total Tuition Paid</div>
          </div>
          <div className="tuition-stat warning">
            <div className="tuition-stat-value">{totalCount}</div>
            <div className="tuition-stat-label">Total Mistakes</div>
          </div>
          <div className="tuition-stat accent">
            <div className="tuition-stat-value most-common">{mostCommon}</div>
            <div className="tuition-stat-label">Most Common Mistake</div>
            {mostCommon && mostCommon !== '—' && MISTAKE_SOLUTIONS[mostCommon] && (
              <div className="tuition-stat-solution" style={{ fontSize: '12px', marginTop: '6px', color: 'var(--accent)', opacity: 0.95, lineHeight: 1.4 }}>
                <strong>💡 Solution:</strong> {MISTAKE_SOLUTIONS[mostCommon]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Mistake Form ── */}
      <div className="card">
        <div className="card-title">
          <AlertTriangle size={16} />
          Log New Mistake
        </div>
        <form className="mistake-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Ticker</label>
              <input
                type="text"
                name="ticker"
                value={form.ticker}
                onChange={handleChange}
                placeholder="BREN"
                maxLength={6}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="field">
              <label>Mistake Type</label>
              <select
                name="mistake_type"
                value={form.mistake_type}
                onChange={handleChange}
              >
                <option value="">— Select mistake —</option>
                {(MISTAKE_TYPES || []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Tuition Cost (Rp)</label>
            <input
              type="number"
              name="tuition_loss"
              value={form.tuition_loss}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>

          <div className="field">
            <label>What Happened</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Describe what happened in detail..."
              rows={3}
            />
          </div>

          <div className="field">
            <label>Action Plan / Lesson Learned</label>
            <textarea
              name="action_plan"
              value={form.action_plan}
              onChange={handleChange}
              placeholder="What will you do differently next time?"
              rows={3}
            />
          </div>

          <button type="submit" className="btn" disabled={!form.ticker || !form.mistake_type}>
            <Receipt size={16} />
            Log Mistake Receipt
          </button>
        </form>
      </div>

      {/* ── Mistake History ── */}
      <div className="card">
        <div className="card-title">
          <TrendingDown size={16} />
          Mistake History
        </div>

        {(!mistakes || mistakes.length === 0) ? (
          <div className="empty-state">
            No mistakes logged yet. Keep it that way — or be honest when they happen.
          </div>
        ) : (
          <div className="mistake-history">
            {mistakes.map((m) => (
              <div key={m.id} className="mistake-receipt">
                <div className="mistake-receipt-header">
                  <div className="mistake-receipt-meta">
                    <span className="ticker-badge">{m.ticker}</span>
                    <span className="mistake-type-badge">{m.mistake_type}</span>
                    <span className="mistake-date">
                      {m.created_at ? fmtDate(m.created_at) : '—'}
                    </span>
                  </div>
                  <div className="mistake-receipt-actions">
                    <span className="mistake-tuition">{fmtRp(m.tuition_loss || 0)}</span>
                    <button
                      className="btn-small"
                      onClick={() => onDeleteMistake(m.id)}
                      title="Delete mistake"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {m.notes && (
                  <div className="mistake-notes">
                    <strong>What happened:</strong> {m.notes}
                  </div>
                )}
                {m.action_plan && (
                  <div className="mistake-action-plan">
                    <strong>Action plan:</strong> {m.action_plan}
                  </div>
                )}
                {m.mistake_type && MISTAKE_SOLUTIONS[m.mistake_type] && (
                  <div className="mistake-mapped-solution" style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.04)',
                    borderLeft: '3px solid var(--danger)',
                    borderRadius: '4px',
                    fontSize: '12.5px',
                    lineHeight: '1.4',
                    color: 'var(--text-primary)'
                  }}>
                    <strong>💡 System Solution:</strong> {MISTAKE_SOLUTIONS[m.mistake_type]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
