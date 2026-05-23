import { fmtRp, fmt, fmtDate } from '../../lib/utils';
import { STATUS_CONFIG } from '../../lib/constants';
import { Trash2 } from 'lucide-react';

export default function PositionsTable({ positions, onDeletePosition, onClearPositions }) {
  if (!positions.length) {
    return (
      <div className="card" style={{ marginTop: 0 }}>
        <div className="table-header">
          <h2>Trade Log & Active Positions</h2>
        </div>
        <div className="empty-state">
          No positions logged. Use the calculator to add trades.
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 0 }}>
      <div className="table-header">
        <h2>Trade Log & Active Positions</h2>
        <button className="btn-small" onClick={onClearPositions}>Clear History</button>
      </div>
      <div className="table-responsive">
        <table className="positions-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Date</th>
              <th>Lot</th>
              <th>Entry</th>
              <th>SL</th>
              <th>TP1/TP2</th>
              <th>Status</th>
              <th>P&L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {positions.map(p => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.open;
              const pnlColor = p.pnl > 0 ? 'var(--success)' : p.pnl < 0 ? 'var(--danger)' : 'var(--text-secondary)';
              const pnlText = p.pnl !== 0
                ? (p.pnl > 0 ? '+' : '') + fmtRp(p.pnl)
                : '—';

              return (
                <tr key={p.id}>
                  <td><span className="ticker-badge">{p.ticker}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {p.trade_date ? fmtDate(p.trade_date) : '—'}
                  </td>
                  <td>{fmt(p.lots)}</td>
                  <td>{fmtRp(p.entry_price)}</td>
                  <td style={{ color: 'var(--danger)' }}>{fmtRp(p.sl_price)}</td>
                  <td>
                    {p.tp1_price ? fmtRp(p.tp1_price) : '—'} / {p.tp2_price ? fmtRp(p.tp2_price) : '—'}
                  </td>
                  <td><span className={`status-pill ${cfg.className}`}>{cfg.label}</span></td>
                  <td style={{ color: pnlColor, fontWeight: 700 }}>{pnlText}</td>
                  <td>
                    <button className="btn-small" onClick={() => onDeletePosition(p.id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
