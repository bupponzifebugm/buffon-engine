import { useState, useMemo, useRef } from 'react';
import { fmtRp, fmtPct, getWeekStartString } from '../../lib/utils';
import { EMOTIONS, RANKS, getRankFromRR, getNextRank, ACHIEVEMENTS, RR_RULES } from '../../lib/constants';
import { ChevronLeft, ChevronRight, TrendingUp, Award, Download, Trophy, Shield, Target, Star } from 'lucide-react';

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

export default function AnalyticsDashboard({ positions, cleanStreak = 0, currentTierKey = 'survival_10m', gamificationState, updateGamificationState }) {
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

  // ── RANK RATING SYSTEM ──
  const rankData = useMemo(() => {
    let totalRR = 0;
    let weekRR = 0;
    const weekStart = getWeekStartString();
    let totalProcessScore = 0;
    let scoredTradeCount = 0;
    let recentResults = [];

    positions.forEach(p => {
      const rr = p.rr_awarded || 0;
      totalRR += rr;
      if (p.trade_date >= weekStart) weekRR += rr;
      if (p.process_score !== null && p.process_score !== undefined && p.status !== 'open') {
        totalProcessScore += (p.process_score || 0);
        scoredTradeCount++;
      }
      // Track last 5 results for match history
      if (p.status !== 'open' && recentResults.length < 8) {
        const isWin = p.pnl > 0;
        const isGoodProcess = (p.process_score || 0) >= 66;
        recentResults.push({ isWin, isGoodProcess, rr });
      }
    });

    const safeRR = Math.max(0, totalRR);
    const currentRank = getRankFromRR(safeRR);
    const nextRank = getNextRank(currentRank);
    const avgProcessScore = scoredTradeCount > 0 ? Math.round(totalProcessScore / scoredTradeCount) : 0;

    // Progress within current rank
    const rrInRank = safeRR - currentRank.minRR;
    const rankRange = nextRank ? (nextRank.minRR - currentRank.minRR) : 100;
    const progressPct = nextRank ? Math.min(100, (rrInRank / rankRange) * 100) : 100;

    // MVP Trade (best R-multiple with 100% process this week)
    const weekTrades = positions.filter(p => p.trade_date >= weekStart && p.pnl > 0);
    let mvpTrade = null;
    let mvpR = 0;
    weekTrades.forEach(p => {
      const riskRp = (p.entry_price && p.sl_price && p.lots && p.entry_price > p.sl_price)
        ? (p.entry_price - p.sl_price) * p.lots * 100 : 0;
      if (riskRp > 0) {
        const r = p.pnl / riskRp;
        if (r > mvpR) { mvpR = r; mvpTrade = p; }
      }
    });

    return { totalRR: safeRR, weekRR, currentRank, nextRank, avgProcessScore, progressPct, recentResults, mvpTrade, mvpR };
  }, [positions]);

  // ── ACHIEVEMENT DETECTION ──
  const unlockedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(a => a.check(positions));
  }, [positions]);

  // ── K/D/A & GAME STATS ──
  const gameStats = useMemo(() => {
    let kills = 0, deaths = 0, assists = 0;
    positions.forEach(p => {
      if (p.status === 'open') return;
      const riskRp = (p.entry_price && p.sl_price && p.lots && p.entry_price > p.sl_price)
        ? (p.entry_price - p.sl_price) * p.lots * 100 : 0;
      
      if (riskRp > 0) {
        const r = p.pnl / riskRp;
        if (r >= 0.5) kills++; // Solid win
        else if (r <= -0.5) deaths++; // Solid loss
        else assists++; // Scratch/Breakeven
      }
    });
    return { kills, deaths, assists };
  }, [positions]);

  // ── REPORT CARD ──
  const [showReportCard, setShowReportCard] = useState(false);
  const reportRef = useRef(null);

  // Bounty editor state
  const [bountyName, setBountyName] = useState(gamificationState?.custom_bounty?.name || 'Self Reward');
  const [bountyTarget, setBountyTarget] = useState(gamificationState?.custom_bounty?.target_rr?.toString() || '500');

  const gState = gamificationState || {
    heavy_shield: 0, ult_points: 0, is_eco_round: false, is_ult_active: false,
    xp_patience: 0, xp_execution: 0, xp_risk: 0, custom_bounty: { current_rr: 0, target_rr: 500, name: 'Self Reward' }
  };

  return (
    <div>
      {/* ── RANKED BANNER (Valorant-Style) ── */}
      <div className="card" style={{ 
        marginBottom: 20, 
        border: `1px solid ${rankData.currentRank.color}`,
        boxShadow: `0 0 20px ${rankData.currentRank.color}22`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle rank glow background */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: 200, height: 200,
          background: `radial-gradient(circle at top right, ${rankData.currentRank.color}15, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          {/* Left: Rank Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: 42,
              lineHeight: 1,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
            }}>
              {rankData.currentRank.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: 2 }}>
                Current Rank
              </div>
              <div style={{ 
                fontSize: 22, 
                fontWeight: 800, 
                fontFamily: 'var(--font-serif)',
                color: rankData.currentRank.color,
                letterSpacing: '-0.01em'
              }}>
                {rankData.currentRank.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: 2 }}>
                {rankData.totalRR} RR
              </div>
            </div>
          </div>

          {/* Center: RR Progress Bar */}
          <div style={{ flex: '1 1 200px', maxWidth: 340, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: rankData.currentRank.color }}>
                {rankData.currentRank.label}
              </span>
              {rankData.nextRank && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {rankData.nextRank.label} ({rankData.nextRank.minRR} RR)
                </span>
              )}
            </div>
            <div style={{ 
              height: 8, 
              background: 'var(--bg-tertiary)', 
              borderRadius: 4, 
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                height: '100%',
                width: `${rankData.progressPct}%`,
                background: `linear-gradient(90deg, ${rankData.currentRank.color}, ${rankData.currentRank.color}CC)`,
                borderRadius: 4,
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 0 8px ${rankData.currentRank.color}44`
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>This Week: <strong style={{ color: rankData.weekRR >= 0 ? 'var(--success)' : 'var(--danger)' }}>{rankData.weekRR >= 0 ? '+' : ''}{rankData.weekRR} RR</strong></span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>APS: <strong style={{ color: rankData.avgProcessScore >= 66 ? 'var(--success)' : 'var(--danger)' }}>{rankData.avgProcessScore}%</strong></span>
            </div>
          </div>

          {/* Right: Match History */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Match History</div>
            <div style={{ display: 'flex', gap: 3 }}>
              {rankData.recentResults.length === 0 && <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>No matches yet</span>}
              {rankData.recentResults.map((r, i) => (
                <div key={i} style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  background: r.isWin ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: r.isWin ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${r.isWin ? 'var(--success)' : 'var(--danger)'}`,
                }}>
                  {r.rr > 0 ? `+${r.rr}` : r.rr}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RPG COMMAND CENTER ── */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {/* K/D/A & Skills */}
        <div className="card">
          <div className="card-title">
            <Target size={16} style={{ color: 'var(--accent)' }} />
            Combat Stats & Skills
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <strong>K/D/A</strong> = Kills (wins ≥ 0.5R) / Deaths (losses ≤ -0.5R) / Assists (scratches). <br/>
            <strong>Skill Trees</strong> level up automatically when you tick Process Checkboxes on every trade. 100% process = +30 XP, 66% = +20 XP, 33% = +10 XP. Every 100 XP = 1 Level Up.
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--bg-tertiary)', padding: 8, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>K/D/A</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--success)' }}>{gameStats.kills}</span>/
                <span style={{ color: 'var(--danger)' }}>{gameStats.deaths}</span>/
                <span style={{ color: 'var(--text-secondary)' }}>{gameStats.assists}</span>
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-tertiary)', padding: 8, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>K/D Ratio</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {gameStats.deaths > 0 ? (gameStats.kills / gameStats.deaths).toFixed(2) : gameStats.kills}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Execution', xp: gState.xp_execution },
              { label: 'Risk Mgmt', xp: gState.xp_risk },
              { label: 'Patience', xp: gState.xp_patience }
            ].map(skill => (
              <div key={skill.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{skill.label} Lvl {Math.floor(skill.xp / 100) + 1}</span>
                  <span style={{ color: 'var(--accent)' }}>{skill.xp % 100}/100 XP</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2 }}>
                  <div style={{ width: `${skill.xp % 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buffs & Ultimates */}
        <div className="card">
          <div className="card-title">
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            Active Buffs
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <strong>Heavy Shield</strong> — Charged by logging trades with 100% process score (+20% each). When full (100%), it blocks the next RR loss entirely, then resets to 0%.<br/>
            <strong>Ultimate</strong> — Earn 1 charge per good-process trade (≥ 66%). At 6/6, press "Activate" → your next win with good process gives <strong>2× RR</strong>.
          </div>
          
          {/* Heavy Shield */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: gState.heavy_shield === 100 ? 'var(--success)' : 'var(--text-primary)' }}>🛡️ Heavy Shield</span>
              <span style={{ fontWeight: 700, color: gState.heavy_shield === 100 ? 'var(--success)' : 'var(--text-secondary)' }}>{gState.heavy_shield}%{gState.heavy_shield === 100 ? ' ✓ READY' : ''}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ width: `${gState.heavy_shield}%`, height: '100%', background: gState.heavy_shield === 100 ? 'var(--success)' : 'var(--accent)', transition: 'width 0.5s ease', boxShadow: gState.heavy_shield === 100 ? '0 0 8px var(--success)' : 'none' }} />
            </div>
          </div>

          {/* Ultimate */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: gState.ult_points === 6 ? 'var(--danger)' : 'var(--text-primary)' }}>🔥 Ultimate: Double RR</span>
              <span style={{ fontWeight: 700, color: gState.ult_points === 6 ? 'var(--danger)' : 'var(--text-secondary)' }}>{gState.ult_points}/6</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4,5,6].map(pt => (
                <div key={pt} style={{ flex: 1, height: 8, borderRadius: 2, background: pt <= gState.ult_points ? (gState.ult_points === 6 ? 'var(--danger)' : 'var(--accent)') : 'var(--bg-tertiary)', transition: 'background 0.3s' }} />
              ))}
            </div>
            {gState.ult_points === 6 && !gState.is_ult_active && (
              <button 
                onClick={() => updateGamificationState?.({ is_ult_active: true })}
                style={{ width: '100%', marginTop: 8, background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '6px', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                ⚡ ACTIVATE ULTIMATE
              </button>
            )}
            {gState.is_ult_active && (
              <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 11, fontWeight: 700, textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
                🔥 ULTIMATE ACTIVE ON NEXT TRADE
              </div>
            )}
          </div>
        </div>

        {/* Eco & Bounty */}
        <div className="card">
          <div className="card-title">
            <Star size={16} style={{ color: 'var(--accent)' }} />
            Missions & Bounties
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
            <strong>Eco Round</strong> — Start this when you're on a losing streak. Trade at half size. If your next trade has ≥ 66% process, you earn a +15 RR recovery bonus.<br/>
            <strong>Custom Bounty</strong> — Set a personal reward (sneakers, sushi, etc.) and a target RR. Every trade fills the bar. Hit 100% → go withdraw and buy it!
          </div>
          
          {/* Eco Round */}
          <div style={{ background: gState.is_eco_round ? 'var(--success-bg)' : 'var(--bg-tertiary)', padding: 12, borderRadius: 8, marginBottom: 16, border: gState.is_eco_round ? '1px solid var(--success)' : '1px solid transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: gState.is_eco_round ? 'var(--success)' : 'var(--text-primary)' }}>🏥 Eco Round</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Half size, +15 RR bonus if clean process.</div>
              </div>
              {!gState.is_eco_round ? (
                <button 
                  onClick={() => updateGamificationState?.({ is_eco_round: true })}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontWeight: 600 }}
                >
                  Start Eco
                </button>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', background: 'var(--success-bg)', padding: '2px 8px', borderRadius: 4 }}>ACTIVE</span>
              )}
            </div>
          </div>

          {/* Custom Bounty — Editable */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>🎁 Custom Bounty</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{gState.custom_bounty?.current_rr || 0} / {gState.custom_bounty?.target_rr || 500} RR</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="e.g. New Sneakers"
                value={bountyName}
                onChange={e => setBountyName(e.target.value)}
                style={{ flex: 2, padding: '6px 10px', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', outline: 'none' }}
              />
              <input
                type="number"
                placeholder="RR Target"
                value={bountyTarget}
                onChange={e => setBountyTarget(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', outline: 'none' }}
              />
              <button
                onClick={() => {
                  if (bountyName.trim() && bountyTarget) {
                    updateGamificationState?.({
                      custom_bounty: {
                        name: bountyName.trim(),
                        target_rr: parseInt(bountyTarget, 10) || 500,
                        current_rr: gState.custom_bounty?.current_rr || 0
                      }
                    });
                  }
                }}
                style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Set
              </button>
            </div>
            <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ width: `${Math.min(100, ((gState.custom_bounty?.current_rr || 0) / (gState.custom_bounty?.target_rr || 500)) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--success))', transition: 'width 0.5s ease' }} />
            </div>
            {(gState.custom_bounty?.current_rr || 0) >= (gState.custom_bounty?.target_rr || 500) && (
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: 'var(--success)', textAlign: 'center' }}>
                🎉 Bounty Complete! Withdraw and go buy your {gState.custom_bounty?.name || 'reward'}!
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* ── TROPHY CASE ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          <Trophy size={16} style={{ color: 'var(--accent)' }} />
          Trophy Case
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Unlock achievements through disciplined execution. Each badge is earned, never given.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {ACHIEVEMENTS.map(a => {
            const isUnlocked = unlockedAchievements.some(u => u.key === a.key);
            return (
              <div
                key={a.key}
                style={{
                  padding: '14px 12px',
                  borderRadius: 8,
                  border: `1px solid ${isUnlocked ? 'var(--accent)' : 'var(--border)'}`,
                  background: isUnlocked ? 'var(--accent-light)' : 'var(--bg-primary)',
                  opacity: isUnlocked ? 1 : 0.45,
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
                  {a.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isUnlocked ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: 2 }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {a.desc}
                </div>
                {isUnlocked && (
                  <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    fontSize: 8,
                    fontWeight: 800,
                    background: 'var(--success)',
                    color: '#fff',
                    padding: '1px 5px',
                    borderRadius: 3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Unlocked
                  </div>
                )}
              </div>
            );
          })}
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

      {/* ── REPORT CARD SECTION ── */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button
          className="btn"
          onClick={() => setShowReportCard(!showReportCard)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={14} />
          {showReportCard ? 'Hide Report Card' : 'Generate Weekly Report Card'}
        </button>
      </div>

      {showReportCard && (
        <div ref={reportRef} style={{ marginTop: 20 }}>
          <div className="card" style={{
            border: '2px solid var(--accent)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: 32,
            maxWidth: 640,
            margin: '0 auto'
          }}>
            {/* Report Header */}
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Buffon Execution Engine
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
                Weekly Report Card
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Rank + Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ textAlign: 'center', padding: '16px 0', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 32 }}>{rankData.currentRank.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: rankData.currentRank.color, fontFamily: 'var(--font-serif)' }}>
                  {rankData.currentRank.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{rankData.totalRR} RR</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 0', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Process Score</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: rankData.avgProcessScore >= 66 ? 'var(--success)' : 'var(--danger)' }}>
                  {rankData.avgProcessScore}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Average (APS)</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 0', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>Skill Rating</div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: rStats.totalR >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {rStats.totalR > 0 ? '+' : ''}{rStats.totalR.toFixed(1)}R
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Total R-Multiple</div>
              </div>
            </div>

            {/* Key Stats */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 12 }}>
                Performance Breakdown
              </div>
              {[
                { label: 'RR This Week', value: `${rankData.weekRR >= 0 ? '+' : ''}${rankData.weekRR} RR`, color: rankData.weekRR >= 0 ? 'var(--success)' : 'var(--danger)' },
                { label: 'Avg Win', value: `+${rStats.avgRWin.toFixed(2)}R`, color: 'var(--success)' },
                { label: 'Avg Loss', value: `${rStats.avgRLoss.toFixed(2)}R`, color: 'var(--danger)' },
                { label: 'System Expectancy', value: `${rStats.expectancy > 0 ? '+' : ''}${rStats.expectancy.toFixed(2)}R/trade`, color: rStats.expectancy >= 0 ? 'var(--success)' : 'var(--danger)' },
                { label: 'Rule Violations', value: `${violationStats.count} (${fmtRp(violationStats.loss)})`, color: violationStats.count > 0 ? 'var(--danger)' : 'var(--success)' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Trophies Earned */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginBottom: 8 }}>
                Trophies Earned ({unlockedAchievements.length} / {ACHIEVEMENTS.length})
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {unlockedAchievements.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No trophies yet. Keep trading.</span>}
                {unlockedAchievements.map(a => (
                  <span key={a.key} style={{ fontSize: 11, padding: '4px 10px', background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--accent)', fontWeight: 700 }}>
                    {a.icon} {a.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "Process beats outcomes. Good discipline + loss = this is fine, variance."
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                buffon-engine v4.0 — {new Date().toLocaleDateString('en-CA')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
