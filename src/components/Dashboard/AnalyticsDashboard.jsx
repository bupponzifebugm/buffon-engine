import { useState, useMemo } from 'react';
import { fmtRp } from '../../lib/utils';
import { EMOTIONS } from '../../lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function formatCompactRp(val) {
  if (val === 0) return 'Rp 0';
  const sign = val > 0 ? '+' : '';
  const abs = Math.abs(val);
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(val / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(val / 1_000).toFixed(0)}K`;
  }
  return `${sign}Rp ${val}`;
}

export default function AnalyticsDashboard({ positions }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Monthly Calendar cells calculation
  const calendarCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const totalDaysPrev = new Date(year, month, 0).getDate();

    const cells = [];

    // 1. Previous month days (muted padding)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = totalDaysPrev - i;
      const prevMonthDate = new Date(year, month - 1, prevDay);
      const dateStr = prevMonthDate.toLocaleDateString('en-CA');
      
      const dayTrades = positions.filter(p => p.trade_date === dateStr);
      const pnl = dayTrades.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const wins = dayTrades.filter(p => p.status === 'tp1' || (p.status === 'closed' && p.pnl > 0)).length;
      const losses = dayTrades.filter(p => p.status === 'sl' || (p.status === 'closed' && p.pnl < 0)).length;
      const violations = dayTrades.filter(p => p.is_violation).length;

      cells.push({
        day: prevDay,
        date: dateStr,
        isMuted: true,
        trades: dayTrades.length,
        pnl,
        wins,
        losses,
        violations
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      
      const dayTrades = positions.filter(p => p.trade_date === dateStr);
      const pnl = dayTrades.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const wins = dayTrades.filter(p => p.status === 'tp1' || (p.status === 'closed' && p.pnl > 0)).length;
      const losses = dayTrades.filter(p => p.status === 'sl' || (p.status === 'closed' && p.pnl < 0)).length;
      const violations = dayTrades.filter(p => p.is_violation).length;

      cells.push({
        day: d,
        date: dateStr,
        isMuted: false,
        trades: dayTrades.length,
        pnl,
        wins,
        losses,
        violations
      });
    }

    // 3. Next month days (muted padding)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const nextDaysNeeded = totalCells - cells.length;
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const nextMonthDate = new Date(year, month + 1, d);
      const dateStr = nextMonthDate.toLocaleDateString('en-CA');
      
      const dayTrades = positions.filter(p => p.trade_date === dateStr);
      const pnl = dayTrades.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const wins = dayTrades.filter(p => p.status === 'tp1' || (p.status === 'closed' && p.pnl > 0)).length;
      const losses = dayTrades.filter(p => p.status === 'sl' || (p.status === 'closed' && p.pnl < 0)).length;
      const violations = dayTrades.filter(p => p.is_violation).length;

      cells.push({
        day: d,
        date: dateStr,
        isMuted: true,
        trades: dayTrades.length,
        pnl,
        wins,
        losses,
        violations
      });
    }

    return cells;
  }, [positions, currentDate]);

  // Emotion PnL Analytics
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
    
    return Object.values(stats).sort((a, b) => b.count - a.count).filter(s => s.count > 0);
  }, [positions]);

  // Violation Stats
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
      {/* ── Monthly Calendar Heatmap ── */}
      <div className="card">
        <div className="calendar-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="card-title" style={{ margin: 0 }}>PnL Heatmap Calendar</div>
          <div className="calendar-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-small" onClick={handlePrevMonth} style={{ padding: 6, display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', minWidth: 120, textAlign: 'center' }}>
              {monthYearLabel}
            </span>
            <button className="btn-small" onClick={handleNextMonth} style={{ padding: 6, display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-primary)' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="calendar-week-days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', marginBottom: 8 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
            <div key={w} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              {w}
            </div>
          ))}
        </div>

        <div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {calendarCells.map((cell, idx) => {
            let dayBg = 'var(--bg-primary)';
            let borderStyle = '1px solid var(--border)';
            let pnlColor = 'var(--text-primary)';
            
            if (cell.trades > 0) {
              if (cell.pnl > 0) {
                dayBg = 'rgba(70, 122, 87, 0.12)';
                borderStyle = '1px solid rgba(70, 122, 87, 0.3)';
                pnlColor = 'var(--success)';
              } else if (cell.pnl < 0) {
                dayBg = 'rgba(184, 75, 75, 0.12)';
                borderStyle = '1px solid rgba(184, 75, 75, 0.3)';
                pnlColor = 'var(--danger)';
              } else {
                dayBg = 'rgba(120, 120, 120, 0.08)';
                borderStyle = '1px solid var(--border)';
              }
            }

            return (
              <div
                key={idx}
                style={{
                  minHeight: 85,
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: dayBg,
                  border: borderStyle,
                  opacity: cell.isMuted ? 0.35 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                className="calendar-day-cell"
                title={`${cell.date}: ${cell.trades} trades, Net PnL: ${fmtRp(cell.pnl)}`}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: cell.trades > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  alignSelf: 'flex-end',
                  lineHeight: 1
                }}>
                  {cell.day}
                </div>

                {cell.trades > 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginTop: 4 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: pnlColor,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center'
                    }}>
                      {formatCompactRp(cell.pnl)}
                    </div>
                    
                    <div style={{
                      fontSize: 9,
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      marginTop: 4,
                      lineHeight: 1.2
                    }}>
                      {cell.trades} T ({cell.wins}W-{cell.losses}L)
                      {cell.violations > 0 && (
                        <div style={{ color: 'var(--danger)', fontWeight: 700, marginTop: 1 }}>
                          ⚠ {cell.violations} Viol.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
              </div>
            );
          })}
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
