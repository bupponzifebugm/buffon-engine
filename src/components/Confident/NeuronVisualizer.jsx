import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function NeuronVisualizer({ jarEntries }) {
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: 400
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 400
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];

    // Core node
    nodes.push({
      id: 'CORE',
      name: 'Total Execution',
      val: 18, 
      color: '#CC785C',
      isCore: true
    });

    jarEntries.forEach((entry, idx) => {
      const profitNum = parseFloat(entry.amount);
      let size = 4;
      if (profitNum > 100000) size = 6;
      if (profitNum > 500000) size = 8;
      if (profitNum > 1000000) size = 12;
      
      nodes.push({
        id: entry.id,
        name: `${entry.ticker} +${entry.amount}`,
        val: size,
        color: '#ff6b35', // Orange/Red theme
        ticker: entry.ticker,
        amount: entry.amount
      });

      // Link to Core
      links.push({
        source: entry.id,
        target: 'CORE'
      });
      
      // Connect to adjacent neurons to form a web
      if (idx > 0) {
        links.push({
          source: entry.id,
          target: jarEntries[idx-1].id
        });
      }
    });

    return { nodes, links };
  }, [jarEntries]);

  if (jarEntries.length === 0) {
    return (
      <div className="card" style={{ marginTop: 24, textAlign: 'center', padding: '40px' }}>
        <div className="card-title">Profit Neural Network</div>
        <p style={{ color: 'var(--text-secondary)' }}>Log a win in the jar to awaken the network.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }} ref={containerRef}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <div className="card-title" style={{ margin: 0 }}>Profit Neural Network</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Drag and throw the neurons around. Larger wins spawn thicker synapses and bigger nodes.
        </div>
      </div>
      <div style={{ width: '100%', background: '#0D0D0D' }}>
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeRelSize={1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            // Glow effect
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(${node.isCore ? '204, 120, 92' : '255, 107, 53'}, 0.3)`;
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Draw text
            const fontSize = Math.max(3, 12 / globalScale);
            ctx.font = `${fontSize}px Inter, Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            
            if (node.isCore) {
              ctx.fillText("CORE", node.x, node.y + node.val + 8);
            } else if (globalScale > 1.2) {
              ctx.fillText(node.ticker, node.x, node.y + node.val + 6);
            }
          }}
          linkColor={() => 'rgba(204, 120, 92, 0.4)'}
          linkWidth={link => link.target.id === 'CORE' ? 2 : 1}
          backgroundColor="#0D0D0D"
          d3VelocityDecay={0.1}
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}
