import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { fmtRp } from '../../lib/utils';
import './TradingCard.css';

export default function TradingCard({ trade }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  if (!trade) return null;

  const isFame = (trade.pnl > 0 && trade.process_score >= 80 && !trade.is_violation);
  const isShame = (trade.pnl < 0 && (trade.process_score < 50 || trade.is_violation));
  const cardType = isFame ? 'fame' : isShame ? 'shame' : 'standard';

  // Calculate R-Multiple if possible
  let rMultiple = null;
  const riskRp = (trade.entry_price && trade.sl_price && trade.lots && trade.entry_price > trade.sl_price) 
    ? (trade.entry_price - trade.sl_price) * trade.lots * 100 
    : 0;
  if (riskRp > 0 && trade.pnl !== null) {
    rMultiple = (trade.pnl / riskRp).toFixed(2);
  }

  const getRarity = () => {
    if (trade.pnl < 0) {
      return { 
        name: '💀 CURSED / SHAME', 
        color: '#ef4444', 
        bg: 'linear-gradient(135deg, #2b1111, #130505)',
        class: 'rarity-cursed',
        accentGlow: 'rgba(239, 68, 68, 0.2)'
      };
    }
    const rVal = Number(rMultiple) || 0;
    if (rVal >= 3) {
      return { 
        name: '👑 LEGENDARY GOLD', 
        color: '#fbbf24', 
        bg: 'linear-gradient(135deg, #1e1b15, #000000)',
        class: 'rarity-legendary',
        accentGlow: 'rgba(251, 191, 36, 0.4)'
      };
    }
    if (rVal >= 2) {
      return { 
        name: '🔮 EPIC PURPLE', 
        color: '#a855f7', 
        bg: 'linear-gradient(135deg, #1b132a, #0b0514)',
        class: 'rarity-epic',
        accentGlow: 'rgba(168, 85, 247, 0.35)'
      };
    }
    if (rVal >= 1) {
      return { 
        name: '⚡ RARE BLUE', 
        color: '#3b82f6', 
        bg: 'linear-gradient(135deg, #0f1c3f, #050a1b)',
        class: 'rarity-rare',
        accentGlow: 'rgba(59, 130, 246, 0.3)'
      };
    }
    return { 
      name: '🍃 COMMON GREEN', 
      color: '#10b981', 
      bg: 'linear-gradient(135deg, #0e201b, #030a08)',
      class: 'rarity-common',
      accentGlow: 'rgba(16, 185, 129, 0.25)'
    };
  };

  const rarity = getRarity();

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    
    const shine = card.querySelector('.card-shine');
    if (shine) {
      const pctX = (x / rect.width) * 100;
      const pctY = (y / rect.height) * 100;
      shine.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    const shine = card.querySelector('.card-shine');
    if (shine) {
      shine.style.background = 'transparent';
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 });
      const link = document.createElement('a');
      link.download = `BuffonCard_${trade.ticker}_${trade.trade_date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export card', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div 
        ref={cardRef} 
        className={`trading-card-container ${rarity.class}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          background: rarity.bg,
          border: `1px solid ${rarity.color}`,
          boxShadow: isHovered 
            ? `0 15px 35px ${rarity.accentGlow}, inset 0 0 15px rgba(255,255,255,0.05)` 
            : `0 8px 24px rgba(0,0,0,0.5)`,
          transition: 'transform 0.1s ease-out, box-shadow 0.2s ease',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Dynamic shine layer */}
        <div className="card-shine" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 11,
          pointerEvents: 'none',
          transition: 'background 0.05s ease-out'
        }}></div>

        {/* Holographic animated overlay for positive/Fame cards */}
        {trade.pnl > 0 && (
          <div className="card-overlay fame-overlay" style={{ zIndex: 10 }}></div>
        )}

        <div className="card-header" style={{ transform: 'translateZ(20px)' }}>
          <div className="card-ticker">{trade.ticker}</div>
          <div className="card-date">{trade.trade_date}</div>
        </div>

        <div className="card-art" style={{ transform: 'translateZ(10px)' }}>
          <div className="art-icon" style={{ color: rarity.color, fontSize: '20px', fontWeight: '800' }}>
            {rarity.name}
          </div>
        </div>

        <div className="card-stats" style={{ transform: 'translateZ(15px)' }}>
          <div className="stat-row">
            <span className="stat-label">Net PnL</span>
            <span className={`stat-value ${trade.pnl > 0 ? 'success' : 'danger'}`}>
              {trade.pnl > 0 ? '+' : ''}{fmtRp(trade.pnl)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">R-Multiple</span>
            <span className={`stat-value ${Number(rMultiple) > 0 ? 'success' : 'danger'}`}>
              {rMultiple ? `${Number(rMultiple) > 0 ? '+' : ''}${rMultiple}R` : 'N/A'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Process Score</span>
            <span className="stat-value">{trade.process_score}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Emotion</span>
            <span className="stat-value capitalize">{trade.emotion || 'Calm'}</span>
          </div>
        </div>

        <div className="card-flavor" style={{ transform: 'translateZ(10px)' }}>
          {isFame 
            ? `"Executed without hesitation. The process provides."`
            : isShame 
              ? `"Paid the market tuition for lack of discipline."`
              : `"Just another trade in the sample size."`}
        </div>
      </div>
      
      <button onClick={handleDownload} className="btn" style={{ fontSize: 11, padding: '6px 12px' }}>
        💾 Save as Image
      </button>
    </div>
  );
}
