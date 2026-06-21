import { useState, useEffect, useRef } from 'react';
import { X, Edit2, Trash2, ChevronLeft, ChevronRight, PlayCircle, PauseCircle } from 'lucide-react';
import { fmtRp, fmtDate } from '../../lib/utils';
import { MISTAKE_SOLUTIONS } from '../../lib/constants';

export default function StoryViewer({ items, type, onClose, onEdit, onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPaused, setIsPaused] = useState(false);

  const DURATION_MS = 10000; // 10 seconds per slide
  const UPDATE_INTERVAL_MS = 50;

  useEffect(() => {
    // Reset progress when index changes
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + (UPDATE_INTERVAL_MS / DURATION_MS) * 100;
        if (next >= 100) {
          handleNext();
          return 0; // reset
        }
        return next;
      });
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, items.length]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // End of stories
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setProgress(0); // Restart first slide
    }
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  
  // Format based on type ('mistake' or 'receipt')
  const isMistake = type === 'mistake';
  const badgeText = isMistake ? currentItem.mistake_type : currentItem.setup_type;
  const moneyValue = isMistake ? currentItem.tuition_loss : currentItem.profit_rp;
  
  // Parse images
  const imageUrls = currentItem.image_url ? currentItem.image_url.split(',').map(u => u.trim()).filter(Boolean) : [];

  return (
    <div 
      className="story-viewer-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Top Bar with Progress */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '4px', height: '3px' }}>
          {items.map((_, idx) => (
            <div key={idx} style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: '#fff', 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                  transition: idx === currentIndex ? 'width 50ms linear' : 'none'
                }} 
              />
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '16px' }}>
              {currentItem.ticker}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              {currentItem.created_at ? fmtDate(currentItem.created_at) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
            >
              {isPaused ? <PlayCircle size={24} /> : <PauseCircle size={24} />}
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        style={{ flex: 1, display: 'flex', position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Invisible tap zones */}
        <div 
          onClick={handlePrev} 
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '30%', zIndex: 10, cursor: 'w-resize' }} 
        />
        <div 
          onClick={handleNext} 
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '70%', zIndex: 10, cursor: 'e-resize' }} 
        />

        {/* Card Content */}
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '500px', 
            maxHeight: '80vh', 
            overflowY: 'auto',
            background: 'var(--bg-primary)', 
            borderRadius: '16px', 
            padding: '24px',
            position: 'relative',
            zIndex: 20, // Above tap zones so scroll/clicks work
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: isMistake ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ 
              color: isMistake ? 'var(--danger)' : 'var(--success)', 
              background: isMistake ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {badgeText}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: isMistake ? 'var(--text-primary)' : 'var(--success)' }}>
              {isMistake ? '-' : '+'} {fmtRp(moneyValue || 0)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentItem.notes && (
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  What Happened
                </strong>
                <p style={{ marginTop: '8px', fontSize: '15px', lineHeight: '1.6' }}>{currentItem.notes}</p>
              </div>
            )}
            
            {(currentItem.action_plan || currentItem.what_worked_well) && (
              <div>
                <strong style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isMistake ? 'Action Plan' : 'What Worked Well'}
                </strong>
                <p style={{ marginTop: '8px', fontSize: '15px', lineHeight: '1.6', color: isMistake ? 'var(--accent)' : 'var(--success)' }}>
                  {isMistake ? currentItem.action_plan : currentItem.what_worked_well}
                </p>
              </div>
            )}

            {isMistake && MISTAKE_SOLUTIONS && MISTAKE_SOLUTIONS[badgeText] && (
              <div style={{
                marginTop: '8px',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                borderLeft: '3px solid var(--danger)',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.5',
              }}>
                <strong>💡 System Reminder:</strong> {MISTAKE_SOLUTIONS[badgeText]}
              </div>
            )}

            {imageUrls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {imageUrls.map((u, i) => (
                  <img key={i} src={u} alt="Attachment" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border)' }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Actions */}
      {onEdit && onDelete && (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '16px', zIndex: 20 }}>
          <button 
            className="btn secondary"
            onClick={() => { onClose(); onEdit(currentItem); }}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}
          >
            <Edit2 size={16} /> Edit
          </button>
          <button 
            className="btn secondary"
            onClick={() => { 
              if (confirm('Delete this item?')) {
                onDelete(currentItem.id);
                handleNext();
              }
            }}
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ff8a8a', border: 'none' }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
