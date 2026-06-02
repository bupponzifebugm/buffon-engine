import { useMemo } from 'react';
import TradingCard from './TradingCard';
import { Trophy, Skull } from 'lucide-react';

export default function CardGallery({ positions }) {
  // Extract Best and Worst trades
  const { fameTrades, shameTrades } = useMemo(() => {
    const closed = positions.filter(p => p.status !== 'open' && p.pnl !== null);
    
    // Fame: > 1R (or just positive PnL) AND 100% Process Score AND not violation
    const fame = closed.filter(p => p.pnl > 0 && p.process_score >= 80 && !p.is_violation)
                       .sort((a, b) => b.pnl - a.pnl)
                       .slice(0, 10); // Top 10

    // Shame: Negative PnL AND (Process Score < 50 OR is violation)
    const shame = closed.filter(p => p.pnl < 0 && (p.process_score < 50 || p.is_violation))
                        .sort((a, b) => a.pnl - b.pnl) // Most negative first
                        .slice(0, 10); // Worst 10

    return { fameTrades: fame, shameTrades: shame };
  }, [positions]);

  return (
    <div className="card-gallery-container" style={{ paddingBottom: 40 }}>
      {/* HALL OF FAME */}
      <div className="card" style={{ marginBottom: 32, border: '1px solid var(--accent)' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20 }}>
          <Trophy size={24} style={{ color: 'var(--accent)' }} />
          Hall of Fame
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          The MVPs. Trades executed with 100% discipline. These are the setups you want to repeat.
        </p>

        {fameTrades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No Hall of Fame trades yet. Execute perfectly to mint a card.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
            {fameTrades.map(t => <TradingCard key={t.id} trade={t} />)}
          </div>
        )}
      </div>

      {/* HALL OF SHAME */}
      <div className="card" style={{ border: '1px solid var(--danger)' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, color: 'var(--danger)' }}>
          <Skull size={24} style={{ color: 'var(--danger)' }} />
          Hall of Shame
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          The Violations. Trades where discipline broke down. Study them so you don't pay tuition twice.
        </p>

        {shameTrades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No Hall of Shame trades! Your discipline is solid.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
            {shameTrades.map(t => <TradingCard key={t.id} trade={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
