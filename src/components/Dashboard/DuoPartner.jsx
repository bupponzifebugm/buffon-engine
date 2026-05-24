import { useState, useEffect } from 'react';
import { DUO_DIALOGUES } from '../../lib/constants';
import { Sparkles } from 'lucide-react';

import baddieNeutral from '../../assets/baddie_neutral.jpg';
import baddieHappy from '../../assets/baddie_happy.png';
import baddieDisappointed from '../../assets/baddie_disappointed.png';
import baddieToxic from '../../assets/baddie_toxic.png';

const IMAGE_MAP = {
  neutral: baddieNeutral,
  happy: baddieHappy,
  disappointed: baddieDisappointed,
  toxic: baddieToxic
};

export default function DuoPartner({ positions, gamificationState, cooldownTimeLeft, ugmStatus }) {
  const [dialogue, setDialogue] = useState('');
  const [imageState, setImageState] = useState('neutral');

  useEffect(() => {
    // Determine the current state based on recent actions
    if (cooldownTimeLeft > 0) {
      setDialogue(getRandom(DUO_DIALOGUES.cooldown));
      setImageState('toxic');
      return;
    }

    if (ugmStatus?.isObservationMode) {
      setDialogue("Market's open, but your UGM classes are calling. Focus on your degree. I'll watch the charts.");
      setImageState('neutral');
      return;
    }

    if (gamificationState?.is_eco_round) {
      setDialogue(getRandom(DUO_DIALOGUES.eco_round));
      setImageState('neutral');
      return;
    }

    if (gamificationState?.ult_points === 6 && !gamificationState?.is_ult_active) {
      setDialogue(getRandom(DUO_DIALOGUES.ult_ready));
      setImageState('happy');
      return;
    }

    if (positions && positions.length > 0) {
      const lastTrade = positions[0];
      const isToday = new Date(lastTrade.trade_date).toDateString() === new Date().toDateString();
      
      if (isToday && lastTrade.status !== 'open') {
        const isWin = lastTrade.pnl > 0;
        const processScore = lastTrade.process_score || 0;
        
        if (isWin && processScore >= 66) {
          setDialogue(getRandom(DUO_DIALOGUES.win_good_process));
          setImageState('happy');
        } else if (isWin && processScore < 66) {
          setDialogue(getRandom(DUO_DIALOGUES.win_bad_process));
          setImageState('disappointed');
        } else if (!isWin && processScore >= 66) {
          setDialogue(getRandom(DUO_DIALOGUES.loss_good_process));
          setImageState('neutral');
        } else {
          setDialogue(getRandom(DUO_DIALOGUES.loss_bad_process));
          setImageState('toxic');
        }
        return;
      }
    }

    // Default idle
    setDialogue(getRandom(DUO_DIALOGUES.idle));
    setImageState('neutral');

  }, [positions, gamificationState, cooldownTimeLeft, ugmStatus]);

  function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  return (
    <div className="card" style={{
      marginBottom: 20,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--accent-light)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '16px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: -20, left: -20,
        width: 100, height: 100,
        background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        background: 'var(--bg-primary)',
        border: '2px solid var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 4px 12px var(--accent-light)',
        overflow: 'hidden'
      }}>
        <img 
          src={IMAGE_MAP[imageState]} 
          alt="Baddie Companion" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>
            System Duo Partner
          </span>
          <Sparkles size={10} style={{ color: 'var(--accent)' }} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          "{dialogue}"
        </div>
      </div>
    </div>
  );
}
