import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function GraveyardVisualizer({ mistakes }) {
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 400
        });
      }
    };

    // Initial delay to let CSS layout finish
    setTimeout(updateSize, 100);
    
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    // Core node
    nodes.push({
      id: 'CORE',
      name: 'Core of Regret',
      val: 24, 
      color: '#450a0a', // deep red/black
      isCore: true
    });

    if (mistakes && mistakes.length > 0) {
      mistakes.forEach((entry, idx) => {
        const lossNum = parseFloat(entry.tuition_loss) || 0;
        let size = 4;
        if (lossNum > 100000) size = 6;
        if (lossNum > 500000) size = 8;
        if (lossNum > 1000000) size = 12;
        if (lossNum > 5000000) size = 18;
        
        const nodeId = entry.id || `mistake-${idx}`;
        nodes.push({
          id: nodeId,
          name: `${entry.ticker || 'UNKNOWN'} -Rp ${lossNum.toLocaleString('id-ID')}`,
          val: size,
          color: '#dc2626', // toxic red
          ticker: entry.ticker,
          amount: lossNum,
          type: entry.mistake_type
        });

        // Link to Core
        links.push({
          source: nodeId,
          target: 'CORE'
        });
        
        // Connect to adjacent mistakes to form a web of regret
        if (idx > 0) {
          links.push({
            source: nodeId,
            target: mistakes[idx-1].id || `mistake-${idx-1}`
          });
        }
      });
    }

    return { nodes, links };
  }, [mistakes]);

  if (!mistakes || mistakes.length === 0) {
    return (
      <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: '40px', background: '#0a0a0a', border: '1px solid #262626' }}>
        <div className="card-title" style={{ color: 'var(--text-secondary)' }}>Graveyard of Mistakes</div>
        <p style={{ color: 'var(--text-secondary)' }}>Your discipline is perfect. The graveyard is empty.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden', background: '#0a0a0a', border: '1px solid #450a0a' }} ref={containerRef}>
      <div style={{ padding: '20px', borderBottom: '1px solid #262626' }}>
        <div className="card-title" style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.2em' }}>🪦</span> Graveyard of Mistakes
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Every red shard is a broken rule. The bigger the shard, the more capital you bled. Do not feed the graveyard.
        </div>
      </div>
      <div style={{ width: '100%', background: '#050505' }}>
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeRelSize={1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            try {
              if (node.x === undefined || node.y === undefined) return;

              const size = node.val || 4;

              // Toxic glow effect
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI, false);
              ctx.fillStyle = `rgba(220, 38, 38, 0.15)`; // red glow
              ctx.fill();

              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
              ctx.fillStyle = `rgba(220, 38, 38, 0.3)`; // inner glow
              ctx.fill();

              // Draw jagged shapes for mistakes, round for core
              ctx.beginPath();
              if (node.isCore) {
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              } else {
                // Draw a jagged crystal/shard shape
                const sides = 5;
                for (let i = 0; i < sides; i++) {
                  const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                  // Randomize radius slightly for jaggedness based on node id
                  const r = size * (0.8 + (Math.sin(node.x * i) * 0.4)); 
                  const px = node.x + r * Math.cos(angle);
                  const py = node.y + r * Math.sin(angle);
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
              }
              
              ctx.fillStyle = node.color || '#dc2626';
              ctx.fill();
              
              // Draw text 
              const scale = Math.max(0.01, globalScale);
              const fontSize = Math.min(60, Math.max(3, 12 / scale));
              ctx.font = `${fontSize}px Inter, Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = node.isCore ? '#ef4444' : '#f87171';
              
              if (node.isCore) {
                ctx.fillText("REGRET", node.x, node.y + size + 10);
              } else if (scale > 1.2 && node.ticker) {
                ctx.fillText(node.ticker, node.x, node.y + size + 6);
                if (scale > 2) {
                  ctx.font = `${fontSize * 0.7}px Inter, Sans-Serif`;
                  ctx.fillStyle = '#fca5a5';
                  ctx.fillText(node.type || '', node.x, node.y + size + 14);
                }
              }
            } catch (err) {
              // ignore
            }
          }}
          linkColor={() => 'rgba(220, 38, 38, 0.2)'}
          linkWidth={link => (link.target && link.target.id === 'CORE') ? 2 : 1}
          backgroundColor="#050505"
          d3VelocityDecay={0.1}
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}
