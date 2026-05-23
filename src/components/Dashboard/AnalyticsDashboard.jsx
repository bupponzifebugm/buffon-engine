import { useMemo } from 'react';
import { fmtRp } from '../../lib/utils';
import { EMOTIONS } from '../../lib/constants';

export default function AnalyticsDashboard({ positions }) {
  // 1. Consistency Heatmap (Last 30 Days)
  const heatmapDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      // Calculate daily PnL for this date
      const dailyTrades = positions.filter(p => p.trade_date === dateStr);
      const pnl = dailyTrades.reduce((sum, p) => sum + (p.pnl || 0), 0);
      
      let status = 'empty';
      if (dailyTrades.length > 0) {
        status = pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'breakeven';
      }
      
      days.push({ date: dateStr, pnl, status, trades: dailyTrades.length });
    }
    return days;
  }, [positions]);

  // 2. Emotion PnL Analytics
  const emotionStats = useMemo(() => {
    const stats = {};
    EMOTIONS.forEach(e => {
      stats[e.value] = { label: e.label, pnl: 0, count: 0, color: e.color };
    });
    
    positions.forEach(p => {
      const e = p.emotion || 'calm';
      if (stats[e]) {
        stats[e].pnl += (p.pnl || 0);
        stats[e].count += 1;
      }
    });
    
    // Sort by most used emotion
    return Object.values(stats).sort((a, b) => b.count - a.count).filter(s => s.count > 0);
  }, [positions]);

  // 3. Violation Stats
  const violationStats = useMemo(() => {
    let violationCount = 0;
    let violationLoss = 0;
    
    positions.forEach(p => {
      if (p.is_violation) {
        violationCount++;
        violationLoss += (p.pnl || 0);
      }
    });
    
    return { count: violationCount, loss: violationLoss };
  }, [positions]);

  return (
    <div>
      <div className="card">
        <div className="card-title">Consistency Heatmap (Last 30 Days)</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Green = Profit. Red = Loss. Gray = No Trade. Protect the streak.
        </p>
        
        <div className="heatmap-grid">
          {heatmapDays.map((day, i) => (
            <div 
              key={i} 
              className={`heatmap-box ${day.status}`}
              title={`${day.date}: ${day.trades} trades, ${fmtRp(day.pnl)}`}
            />
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Emotion PnL Analytics</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            The "Mirror". How your feelings affect your wallet.
          </p>
          
          <table className="system-table">
            <thead>
              <tr>
                <th>Emotion</th>
                <th>Trades</th>
                <th>Total PnL</th>
              </tr>
            </thead>
            <tbody>
              {emotionStats.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No emotion data yet.</td></tr>
              )}
              {emotionStats.map(stat => (
                <tr key={stat.label}>
                  <td>
                    <span className={`emotion-tag active ${stat.color}`} style={{ display: 'inline-block', padding: '3px 8px', fontSize: 11 }}>
                      {stat.label}
                    </span>
                  </td>
                  <td>{stat.count}</td>
                  <td style={{ color: stat.pnl > 0 ? 'var(--success)' : stat.pnl < 0 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 700 }}>
                    {stat.pnl > 0 ? '+' : ''}{fmtRp(stat.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ border: violationStats.count > 0 ? '1px solid var(--danger)' : '' }}>
          <div className="card-title" style={{ color: 'var(--danger)' }}>System Violation Cost</div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Total Money Lost to Undisciplined Trades
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--danger)', fontFamily: 'var(--font-mono)', margin: '12px 0' }}>
              {fmtRp(violationStats.loss)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Across <b>{violationStats.count}</b> rule violations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
