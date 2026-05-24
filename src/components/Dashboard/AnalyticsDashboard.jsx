import { useState, useMemo } from 'react';
import { fmtRp, fmtPct } from '../../lib/utils';
import { EMOTIONS } from '../../lib/constants';
import { ChevronLeft, ChevronRight, TrendingUp, Award } from 'lucide-react';

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

export default function AnalyticsDashboard({ positions, cleanStreak = 0, currentTierKey = 'survival_10m' }) {
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

  // Equity Curve Point Calculations
  const sortedPositions = useMemo(() => {
    return [...positions].reverse();
  }, [positions]);

  const chartPoints = useMemo(() => {
    let current = 0;
    const pts = [0];
    sortedPositions.forEach(p => {
      current += (p.pnl || 0);
      pts.push(current);
    });
    return pts;
  }, [sortedPositions]);

  const chartDetails = useMemo(() => {
    const w = 600;
    const h = 180;
    const pad = 20;

    const maxVal = Math.max(...chartPoints, 100_000);
    const minVal = Math.min(...chartPoints, -100_000);
    const range = maxVal - minVal || 1;

    const linePoints = chartPoints.map((val, idx) => {
      const x = pad + (idx / (chartPoints.length - 1 || 1)) * (w - 2 * pad);
      const y = h - pad - ((val - minVal) / range) * (h - 2 * pad);
      return { x, y, val };
    });

    const zeroY = h - pad - ((0 - minVal) / range) * (h - 2 * pad);

    const pathD = linePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    
    // Close the area path down to the zeroY line
    const areaD = linePoints.length > 0
      ? `M ${linePoints[0].x.toFixed(1)} ${zeroY.toFixed(1)} L ${linePoints.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} L ${linePoints[linePoints.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} Z`
      : '';

    return {
      width: w,
      height: h,
      pathD,
      areaD,
      zeroY,
      netProfit: chartPoints[chartPoints.length - 1] || 0,
      points: linePoints
    };
  }, [chartPoints]);

  // Upgrade Runway Stats
  const runwayStats = useMemo(() => {
    const currentStreak = cleanStreak || 0;
    let target = 0;
    let nextTierName = '';

    if (currentTierKey === 'survival_10m') {
      target = 10;
      nextTierName = 'Step 1 (Rp 15M)';
    } else if (currentTierKey === 'step1_15m') {
      target = 20;
      nextTierName = 'Step 2 (Rp 20M)';
    } else if (currentTierKey === 'step2_20m') {
      target = 30;
      nextTierName = 'Full Deployment (Rp 25M)';
    } else {
      return { isMax: true };
    }

    const remaining = Math.max(0, target - currentStreak);
    return {
      isMax: false,
      nextTierName,
      target,
      current: currentStreak,
      remaining,
      pct: Math.min(100, (currentStreak / target) * 100),
    };
  }, [currentTierKey, cleanStreak]);

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

  // R-Multiple Analytics
  const rStats = useMemo(() => {
    let totalR = 0;
    let rWins = [];
    let rLosses = [];

    positions.forEach(p => {
      const riskRp = (p.entry_price && p.sl_price && p.lots && p.entry_price > p.sl_price) 
        ? (p.entry_price - p.sl_price) * p.lots * 100 
        : 0;
      
      if (riskRp > 0 && p.pnl !== null && p.pnl !== undefined && p.pnl !== 0) {
        const tradeR = p.pnl / riskRp;
        totalR += tradeR;
        if (tradeR > 0) rWins.push(tradeR);
        else if (tradeR < 0) rLosses.push(tradeR);
      }
    });

    const avgRWin = rWins.length > 0 ? rWins.reduce((a,b)=>a+b, 0) / rWins.length : 0;
    const avgRLoss = rLosses.length > 0 ? rLosses.reduce((a,b)=>a+b, 0) / rLosses.length : 0;
    const winRate = (rWins.length + rLosses.length) > 0 ? rWins.length / (rWins.length + rLosses.length) : 0;
    const expectancy = (avgRWin * winRate) + (avgRLoss * (1 - winRate));

    return { totalR, avgRWin, avgRLoss, expectancy, count: rWins.length + rLosses.length };
  }, [positions]);

  const finalCumulativePnl = chartDetails.netProfit;

  return (
    <div>
      {/* ── TOP SECTION: SVG EQUITY CURVE & UPGRADE RUNWAY ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Equity Curve Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            Performance Equity Curve
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Net PnL Cumulative</span>
            <strong style={{
              fontSize: 24,
              fontWeight: 800,
              color: finalCumulativePnl > 0 ? 'var(--success)' : finalCumulativePnl < 0 ? 'var(--danger)' : 'var(--text-primary)',
              fontFamily: 'var(--font-mono)'
            }}>
              {finalCumulativePnl > 0 ? '+' : ''}{fmtRp(finalCumulativePnl)}
            </strong>
          </div>

          <div style={{ flex: 1, position: 'relative', background: 'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', padding: 8 }}>
            <svg 
              viewBox={`0 0 ${chartDetails.width} ${chartDetails.height}`} 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={finalCumulativePnl >= 0 ? 'var(--success)' : 'var(--danger)'} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={finalCumulativePnl >= 0 ? 'var(--success)' : 'var(--danger)'} stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Zero-Reference Line */}
              <line 
                x1="20" y1={chartDetails.zeroY} 
                x2="580" y2={chartDetails.zeroY} 
                stroke="var(--border-strong)" 
                strokeWidth="1.2" 
                strokeDasharray="4 4" 
              />
              <text 
                x="24" y={chartDetails.zeroY - 4} 
                fill="var(--text-secondary)" 
                fontSize="9" 
                fontWeight="700" 
                opacity="0.6"
              >
                BE Reference
              </text>

              {/* Filled Area Gradient */}
              {chartDetails.areaD && (
                <path d={chartDetails.areaD} fill="url(#areaGrad)" />
              )}

              {/* Solid Curve Line */}
              {chartDetails.pathD && (
                <path 
                  d={chartDetails.pathD} 
                  fill="none" 
                  stroke={finalCumulativePnl >= 0 ? 'var(--success)' : 'var(--danger)'} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* Node Circles */}
              {chartDetails.points.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r={chartDetails.points.length > 30 ? '1.5' : '3'} 
                  fill={p.val >= 0 ? 'var(--success)' : 'var(--danger)'} 
                  stroke="var(--bg-primary)" 
                  strokeWidth="1" 
                  opacity="0.9"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Upgrade Runway Progress Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="card-title">
            <Award size={16} style={{ color: 'var(--purple)' }} />
            Capital Upgrade Runway
          </div>

          {runwayStats?.isMax ? (
            <div style={{ textAlign: 'center', padding: '32px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
              <strong style={{ fontSize: 16, color: 'var(--success)' }}>FULL DEPLOYMENT TIER</strong>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                You are at the maximum capital tier. Preserve discipline to protect your capital.
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Next Tier: <strong>{runwayStats.nextTierName}</strong>
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>
                  {runwayStats.current} / {runwayStats.target} Clean
                </span>
              </div>

              {/* Progress Bar Container */}
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{
                  height: '100%',
                  width: `${runwayStats.pct}%`,
                  background: 'var(--purple)',
                  borderRadius: 4,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '12px 14px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                  Streak Progress:
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  You need <strong style={{ color: 'var(--purple)' }}>{runwayStats.remaining} more</strong> consecutive clean trades without rules violations to unlock your next capital limit upgrade. Keep executing the system.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MIDDLE SECTION: MONTHLY HEATMAP CALENDAR ── */}
      <div className="card" style={{ marginBottom: 20 }}>
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

      {/* ── BOTTOM SECTION: R-MULTIPLE, EMOTIONS, & VIOLATIONS ── */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        
        {/* R-Multiple Stats */}
        <div className="card" style={{ border: '1px solid var(--accent)', boxShadow: '0 0 12px rgba(204, 120, 92, 0.12)' }}>
          <div className="card-title" style={{ color: 'var(--accent)' }}>Skill Progress (R-Multiples)</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Normalized performance detached from IDR sizing.
          </p>
          
          <div style={{ textAlign: 'center', padding: '12px 0', background: 'var(--bg-primary)', borderRadius: 6, marginBottom: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Total R Generated</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: rStats.totalR >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
              {rStats.totalR > 0 ? '+' : ''}{rStats.totalR.toFixed(2)}R
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Across {rStats.count} valid trades</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Avg Winning Trade</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>+{rStats.avgRWin.toFixed(2)}R</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Avg Losing Trade</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{rStats.avgRLoss.toFixed(2)}R</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>System Expectancy</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: rStats.expectancy >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {rStats.expectancy > 0 ? '+' : ''}{rStats.expectancy.toFixed(2)}R / trade
            </span>
          </div>
        </div>

        {/* Emotion Analytics */}
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
