import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { fmtRp } from '../../lib/utils';
import './TradingCard.css';

export default function TradingCard({ trade }) {
  const cardRef = useRef(null);
  
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
        className={`trading-card-container ${cardType}`}
      >
        {/* Holographic overlay for Fame, Rusted overlay for Shame */}
        <div className={`card-overlay ${cardType}-overlay`}></div>
        
        <div className="card-header">
          <div className="card-ticker">{trade.ticker}</div>
          <div className="card-date">{trade.trade_date}</div>
        </div>

        <div className="card-art">
          {isFame ? (
            <div className="art-icon fame-icon">⭐ MVP</div>
          ) : isShame ? (
            <div className="art-icon shame-icon">💀 REKT</div>
          ) : (
            <div className="art-icon standard-icon">⚖️ STANDARD</div>
          )}
        </div>

        <div className="card-stats">
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

        <div className="card-flavor">
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
