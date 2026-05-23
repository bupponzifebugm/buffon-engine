import { AlertTriangle, Shield, Flame, Brain, Clock, TrendingDown } from 'lucide-react';
import { fmtRp } from '../../lib/utils';
import { TIERS, TIER_ORDER } from '../../lib/constants';

const LIFE_DISCIPLINES = [
  'Target sleep 11:30 PM, wake 08:00 AM. IF 17/7. Life discipline = trading discipline.',
  'Timothy Ronald did 10 years. You are 7 months in. Respect the timeline.',
  'No screen time before Morning Gate is complete. Phone down until 08:30.',
  'Gym 3x/week. A healthy body = a sharp mind. No excuses.',
  'Sunday = review week. Plan next week. No trades on Sunday. Rest is productive.',
  'Read 10 pages/day. Compound knowledge like compound interest.',
  'Gratitude journal before bed. Abundance mindset attracts abundance.',
];

function getIDRAlert(rate) {
  if (rate > 17500) {
    return {
      level: 'danger',
      icon: <Shield size={16} />,
      text: `SURVIVAL MODE — IDR ${rate.toLocaleString('id-ID')}. Risk capped at 0.5% (Rp 125,000). Max position 25%.`,
    };
  }
  if (rate >= 17000) {
    return {
      level: 'warning',
      icon: <AlertTriangle size={16} />,
      text: `HIGH RISK MODE — IDR ${rate.toLocaleString('id-ID')}. Risk at 0.75%. Max position 30%.`,
    };
  }
  if (rate >= 16500) {
    return {
      level: 'info',
      icon: <AlertTriangle size={16} />,
      text: `ELEVATED MODE — IDR ${rate.toLocaleString('id-ID')}. Risk at 0.85%. Max position 35%.`,
    };
  }
  return {
    level: 'success',
    icon: <Shield size={16} />,
    text: `FAVORABLE MODE — IDR ${rate.toLocaleString('id-ID')}. Risk at 1.0%. Max position 40%.`,
  };
}

export default function AlertCenter({
  todaysGate,
  cleanStreak,
  currentTierKey,
  dailyPnl,
  weeklyPnl,
  monthlyPnl,
  tierConfig,
  positions,
  cooldownTimeLeft,
  ugmStatus
}) {
  if (!todaysGate) {
    return (
      <div className="alert-center">
        <div className="alert-item info">
          <Brain size={16} />
          <span>Complete your Morning Gate to see alerts.</span>
        </div>
      </div>
    );
  }

  const alerts = [];

  // 1. IDR Sizing Mode (always show)
  if (todaysGate.usd_idr_rate) {
    const idrAlert = getIDRAlert(todaysGate.usd_idr_rate);
    alerts.push(idrAlert);
  }

  // 2. Focus Score warning
  if (todaysGate.focus_score != null) {
    if (todaysGate.focus_score < 7) {
      alerts.push({
        level: 'danger',
        icon: <Brain size={16} />,
        text: `🚫 Focus below 7 (${todaysGate.focus_score}/10). Close Stockbit. No trading today.`,
      });
    } else if (todaysGate.focus_score <= 7) {
      alerts.push({
        level: 'warning',
        icon: <Brain size={16} />,
        text: `⚠️ Focus Score is ${todaysGate.focus_score}. Only high-conviction setups. Stay tight.`,
      });
    }
  }

  // 3. Macro warning (added to list as fallback; main alert is displayed in the custom banner below)
  if (todaysGate.macro_env === 'red') {
    alerts.push({
      level: 'danger',
      icon: <AlertTriangle size={16} />,
      text: '🔴 Macro is RED. Wait 1hr after 09:00 before any entry.',
    });
  }

  // 4. Challenge streak
  if (cleanStreak > 0) {
    const currentIdx = TIER_ORDER.indexOf(currentTierKey);
    const nextTierKey = currentIdx < TIER_ORDER.length - 1 ? TIER_ORDER[currentIdx + 1] : null;
    const nextTier = nextTierKey ? TIERS[nextTierKey] : null;
    const requiredForNext = nextTier ? nextTier.requiredStreak : null;
    const remaining = requiredForNext != null ? Math.max(0, requiredForNext - cleanStreak) : 0;

    if (nextTier && remaining > 0) {
      alerts.push({
        level: 'success',
        icon: <Flame size={16} />,
        text: `🔥 ${cleanStreak} clean trades! ${remaining} more to unlock ${nextTier.label}.`,
      });
    } else if (!nextTier) {
      alerts.push({
        level: 'success',
        icon: <Flame size={16} />,
        text: `🔥 ${cleanStreak} clean trades! Full Deployment unlocked. Maintain discipline.`,
      });
    }
  }

  // 5. Drawdown alerts
  if (tierConfig) {
    const dailyLimit = tierConfig.capital * (tierConfig.dailyLimitPct / 100);
    const weeklyLimit = tierConfig.capital * (tierConfig.weeklyLimitPct / 100);
    const monthlyLimit = tierConfig.capital * (tierConfig.monthlyLimitPct / 100);

    if (dailyPnl < 0) {
      const pct = Math.abs(dailyPnl) / dailyLimit;
      if (pct >= 1) {
        alerts.push({
          level: 'danger',
          icon: <TrendingDown size={16} />,
          text: `🚨 DAILY LIMIT BREACHED! Loss ${fmtRp(Math.abs(dailyPnl))} / ${fmtRp(dailyLimit)}. STOP TRADING NOW.`,
        });
      } else if (pct >= 0.7) {
        alerts.push({
          level: 'warning',
          icon: <TrendingDown size={16} />,
          text: `⚠️ Daily drawdown at ${(pct * 100).toFixed(0)}% of limit (${fmtRp(Math.abs(dailyPnl))} / ${fmtRp(dailyLimit)}). Tighten risk.`,
        });
      }
    }

    if (weeklyPnl < 0) {
      const pct = Math.abs(weeklyPnl) / weeklyLimit;
      if (pct >= 1) {
        alerts.push({
          level: 'danger',
          icon: <TrendingDown size={16} />,
          text: `🚨 WEEKLY LIMIT BREACHED! Loss ${fmtRp(Math.abs(weeklyPnl))} / ${fmtRp(weeklyLimit)}. No more trades this week.`,
        });
      } else if (pct >= 0.7) {
        alerts.push({
          level: 'warning',
          icon: <TrendingDown size={16} />,
          text: `⚠️ Weekly drawdown at ${(pct * 100).toFixed(0)}% of limit (${fmtRp(Math.abs(weeklyPnl))} / ${fmtRp(weeklyLimit)}).`,
        });
      }
    }

    if (monthlyPnl < 0) {
      const pct = Math.abs(monthlyPnl) / monthlyLimit;
      if (pct >= 1) {
        alerts.push({
          level: 'danger',
          icon: <TrendingDown size={16} />,
          text: `🚨 MONTHLY LIMIT BREACHED! Loss ${fmtRp(Math.abs(monthlyPnl))} / ${fmtRp(monthlyLimit)}. Full stop until next month.`,
        });
      } else if (pct >= 0.7) {
        alerts.push({
          level: 'warning',
          icon: <TrendingDown size={16} />,
          text: `⚠️ Monthly drawdown at ${(pct * 100).toFixed(0)}% of limit (${fmtRp(Math.abs(monthlyPnl))} / ${fmtRp(monthlyLimit)}).`,
        });
      }
    }
  }

  // 6. Stockbit/Ajaib reminder
  alerts.push({
    level: 'info',
    icon: <Clock size={16} />,
    text: 'STOCKBIT = Scalp/Intraday | AJAIB = Invest Only. Never mix.',
  });

  // 7. Life discipline
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const todayQuote = LIFE_DISCIPLINES[dayOfYear % LIFE_DISCIPLINES.length];
  alerts.push({
    level: 'info',
    icon: <Brain size={16} />,
    text: todayQuote,
  });

  const isMarketBad = todaysGate.macro_env === 'red';

  return (
    <div className="alert-center-wrapper">
      {/* ── MARKET BAD BANNER ── */}
      {isMarketBad && (
        <div className="market-alert-banner" style={{
          background: 'rgba(184, 75, 75, 0.12)',
          border: '1px solid var(--danger)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>NO TRADE TODAY</span>
            <strong style={{ fontSize: '15px', color: 'var(--danger)', fontFamily: 'var(--font-serif)' }}>
              🚫 Critical Macro Environment is RED
            </strong>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Intraday execution is locked. If you absolutely must take action: 
            <strong style={{ color: 'var(--text-primary)' }}> BSJP Mode only</strong> (Beli Siang Jual Pagi) under two conditions:
          </p>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <li>You have clear conviction that tomorrow is a red/down day (for short targets/hedges).</li>
            <li>AlgoTrade bot signals (Score &ge; 80) explicitly agree with the BSJP entry.</li>
          </ul>
        </div>
      )}

      {/* ── REVENGE TRADING LOCKOUT TIMER ── */}
      {cooldownTimeLeft > 0 && (
        <div className="cooldown-alert-banner" style={{
          background: 'rgba(219, 143, 83, 0.12)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--warning)', animation: 'pulse 1.5s infinite' }} />
              <strong style={{ fontSize: '14px' }}>⚠️ REVENGE TRADING COOLDOWN ACTIVE</strong>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
              {Math.floor(cooldownTimeLeft / 60).toString().padStart(2, '0')}:{(cooldownTimeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            System locked following a loss or violation. Step away from the screens. Re-establish calm mindset.
          </p>
        </div>
      )}

      {/* ── UGM ACADEMIC BLOCK BANNER ── */}
      {ugmStatus?.isObservationMode && (
        <div className="ugm-alert-banner" style={{
          background: 'rgba(122, 99, 153, 0.12)',
          border: '1px solid var(--purple)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
          color: 'var(--text-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              background: 'var(--purple)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>OBSERVATION ONLY</span>
            <strong style={{ fontSize: '14px', color: 'var(--purple)' }}>
              🎓 UGM Academic Block: {ugmStatus.currentClass}
            </strong>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Class schedule or weekend/observation block is currently active. Execution engines are paused. Observe orderbook actions only.
          </p>
        </div>
      )}

      {/* ── Standard Alerts Stack ── */}
      <div className="alert-center">
        {alerts.map((alert, idx) => (
          <div key={idx} className={`alert-item ${alert.level}`}>
            {alert.icon}
            <span>{alert.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
