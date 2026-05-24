import { fmtRp, fmt, fmtDate } from '../../lib/utils';
import { STATUS_CONFIG } from '../../lib/constants';
import { Trash2, ShieldAlert } from 'lucide-react';

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

  const tp1Positions = positions.filter(p => p.status === 'tp1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Active Risk-Free Trades (Free Trade Mode) ── */}
      {tp1Positions.length > 0 && (
        <div className="card" style={{ margin: 0, border: '1px solid var(--accent)', boxShadow: '0 0 12px rgba(204, 120, 92, 0.12)' }}>
          <div className="card-title" style={{ color: 'var(--accent)' }}>
            <ShieldAlert size={16} />
            🛡️ Free Trade Mode Active (Risk-Free)
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            The following active positions have reached TP1. Ensure rules compliance for breakeven status.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {tp1Positions.map(p => (
              <div 
                key={p.id} 
                style={{ 
                  flex: '1 1 260px',
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 6, 
                  padding: '12px 14px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="ticker-badge" style={{ fontSize: 15 }}>{p.ticker}</span>
                  <span style={{ 
                    fontSize: 9, 
                    fontWeight: 700, 
                    background: 'rgba(204, 120, 92, 0.12)', 
                    color: 'var(--accent)', 
                    padding: '2px 6px', 
                    borderRadius: 4,
                    textTransform: 'uppercase'
                  }}>
                    TP1 Secured
                  </span>
                </div>
                
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Entry: <strong>{fmtRp(p.entry_price)}</strong> | Lots: <strong>{fmt(p.lots)}</strong>
                </div>

                <div style={{ background: 'var(--surface)', padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    BE Rule Compliance:
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: 2, fontWeight: 600 }}>
                    <div>✓ Sold 40% ({fmt(Math.round(p.lots * 0.4))} Lots) at {p.tp1_price ? fmtRp(p.tp1_price) : 'TP1'}</div>
                    <div>✓ Stop Loss moved to Entry ({fmtRp(p.entry_price)})</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Standard Positions Table ── */}
      <div className="card" style={{ margin: 0 }}>
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
                <th>R-Mult</th>
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

                const riskRp = (p.entry_price && p.sl_price && p.lots && p.entry_price > p.sl_price) 
                  ? (p.entry_price - p.sl_price) * p.lots * 100 
                  : 0;
                
                const tradeR = (riskRp > 0 && p.pnl !== null && p.pnl !== undefined && p.pnl !== 0)
                  ? (p.pnl / riskRp).toFixed(2)
                  : null;

                const rColor = tradeR && tradeR > 0 ? 'var(--success)' : tradeR && tradeR < 0 ? 'var(--danger)' : 'var(--text-secondary)';
                const rText = tradeR ? (tradeR > 0 ? `+${tradeR}R` : `${tradeR}R`) : '—';

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
                    <td style={{ color: rColor, fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{rText}</td>
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
    </div>
  );
}
