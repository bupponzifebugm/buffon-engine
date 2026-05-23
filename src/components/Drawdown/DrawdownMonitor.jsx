import { fmtRp, fmt, fmtPct } from '../../lib/utils';

export default function DrawdownMonitor({ capital, dailyPnl, weeklyPnl, monthlyPnl, tierConfig }) {
  const dailyLimit = capital * (tierConfig.dailyLimitPct / 100);
  const weeklyLimit = capital * (tierConfig.weeklyLimitPct / 100);
  const monthlyLimit = capital * (tierConfig.monthlyLimitPct / 100);

  function renderCard(label, limitPct, limitAmt, pnl, actionText, criticalText) {
    const loss = Math.max(0, -pnl);
    const pct = Math.min((loss / limitAmt) * 100, 100);
    const isCritical = pct >= 100;
    const barColor = pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)';
    const pnlColor = pnl > 0 ? 'var(--success)' : pnl < 0 ? 'var(--danger)' : 'var(--text-primary)';

    return (
      <div className="dd-card">
        <div className="dd-header">
          <span>{label} ({limitPct}%)</span>
          <span className="dd-limit">-{fmtRp(limitAmt)}</span>
        </div>
        <div className="dd-pnl" style={{ color: pnlColor }}>
          {pnl > 0 ? '+' : ''}{fmtRp(pnl)}
        </div>
        <div className="progress-bg">
          <div
            className="progress-fill"
            style={{ width: pct + '%', background: barColor }}
          />
        </div>
        <div
          className="dd-action"
          style={isCritical ? { color: 'var(--danger)', fontWeight: 700 } : {}}
        >
          {isCritical ? `CRITICAL: ${criticalText}` : `Action: ${actionText}`}
        </div>
      </div>
    );
  }

  return (
    <div className="dd-slider-container">
      <div className="dd-section-label">Live Drawdown Monitor</div>
      <div className="dd-slider">
        {renderCard(
          'Daily P&L Limit',
          tierConfig.dailyLimitPct,
          dailyLimit,
          dailyPnl,
          'Close platform if hit.',
          'LIMIT HIT. Close Stockbit immediately.'
        )}
        {renderCard(
          'Weekly Drawdown',
          tierConfig.weeklyLimitPct,
          weeklyLimit,
          weeklyPnl,
          'Revert to previous tier next week if hit.',
          'LIMIT HIT. Next week scales down.'
        )}
        {renderCard(
          'Monthly Drawdown',
          tierConfig.monthlyLimitPct,
          monthlyLimit,
          monthlyPnl,
          '5-Day Mandatory Pause & Audit if hit.',
          'LIMIT HIT. 5-Day Pause Mandated.'
        )}
      </div>
    </div>
  );
}
