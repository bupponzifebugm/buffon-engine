import { useEffect, useRef, useState } from 'react';
import { DAILY_QUOTES } from '../../lib/constants';
import { getDayOfYear } from '../../lib/utils';
import { Quote, Eye, EyeOff } from 'lucide-react';

export default function DailyQuote() {
  const canvasRef = useRef(null);
  const [particlesActive, setParticlesActive] = useState(true);
  const dayOfYear = getDayOfYear();
  const quote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];

  useEffect(() => {
    if (!particlesActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 420;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle setup (Starfield)
    const particles = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.8 + 0.4,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -Math.random() * 0.25 - 0.05, // slowly float up
        alpha: Math.random() * 0.6 + 0.1
      });
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Deep space night sky background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0a0a14');
      bgGrad.addColorStop(1, '#040408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`; // soft indigo star tint
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [particlesActive]);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {particlesActive ? (
        <canvas 
          ref={canvasRef} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            zIndex: 1, 
            display: 'block' 
          }} 
        />
      ) : (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--bg-secondary)', zIndex: 1 }} />
      )}

      {/* Glass overlay with quote details */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        padding: '32px',
        maxWidth: '560px',
        textAlign: 'center',
        background: 'rgba(10, 10, 20, 0.65)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        margin: '0 16px',
        boxSizing: 'border-box'
      }}>
        <Quote size={32} style={{ color: 'var(--accent)', opacity: 0.5 }} />
        
        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          lineHeight: '1.6',
          color: '#ffffff',
          fontStyle: 'italic',
          fontFamily: 'var(--font-sans)'
        }}>
          "{quote.text}"
        </div>

        <div style={{
          fontSize: '13px',
          fontWeight: '700',
          color: 'var(--accent)',
          letterSpacing: '1px',
          textTransform: 'uppercase'
        }}>
          — {quote.author}
        </div>
      </div>

      {/* Float overlay button for Zen Toggle */}
      <button 
        onClick={() => setParticlesActive(prev => !prev)}
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 3,
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s',
          outline: 'none'
        }}
        title={particlesActive ? "Disable Zen Starfield" : "Enable Zen Starfield"}
      >
        {particlesActive ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
