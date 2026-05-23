import { TIERS, TIER_ORDER } from '../../lib/constants';
import { TrendingUp, Trophy, AlertTriangle } from 'lucide-react';

export default function ChallengeTracker({ challengeData, cleanStreak, currentTierKey, onUpdateTrade }) {
  const currentTier = TIERS[currentTierKey];

  // Find next tier for upgrade banner
  const currentTierIndex = TIER_ORDER.indexOf(currentTierKey);
  const nextTierKey = currentTierIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentTierIndex + 1] : null;
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;

  function handleDotClick(index) {
    const currentStatus = challengeData[index];
    const nextStatus = (currentStatus + 1) % 4;
    onUpdateTrade(index, nextStatus);
  }

  return (
    <div className="card">
      <div className="card-title">30-Trade Challenge Tracker</div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
        Violation <span style={{ color: 'var(--warning)', fontWeight: 700 }}>(Gold)</span> resets your streak.
        Click each dot to cycle: Empty → Win → Loss → Violation.
      </div>

      <div className="challenge-grid">
        {challengeData.map((status, index) => {
          const cls = status === 1 ? ' win' : status === 2 ? ' loss' : status === 3 ? ' violation' : '';
          return (
            <div
              key={index}
              className={`trade-dot${cls}`}
              onClick={() => handleDotClick(index)}
              title={`Trade ${index + 1}: ${status === 0 ? 'Empty' : status === 1 ? 'Win' : status === 2 ? 'Loss (Clean)' : 'Violation'}`}
            >
              {index + 1}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <div className="challenge-legend" style={{ marginTop: 0 }}>
          <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--success)' }} /> Win</div>
          <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--danger)' }} /> Loss</div>
          <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--warning)' }} /> Violation</div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {cleanStreak} Clean Streak
        </div>
      </div>

      {/* Upgrade Banner */}
      {nextTier ? (
        <div className="upgrade-banner">
          <Trophy size={18} />
          <div>
            <strong>{nextTier.label}</strong>: {cleanStreak}/{nextTier.requiredStreak} clean trades.
            {' '}{nextTier.requiredStreak - cleanStreak} more to unlock {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(nextTier.capital)}.
          </div>
        </div>
      ) : (
        <div className="upgrade-banner" style={{ background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(70,122,87,0.2)' }}>
          <Trophy size={18} />
          <div>
            <strong>Full Deployment Unlocked!</strong> You've earned the right to trade at Rp 25,000,000.
          </div>
        </div>
      )}
    </div>
  );
}
