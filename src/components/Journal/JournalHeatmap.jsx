import { useMemo } from 'react';

export default function JournalHeatmap({ notes, onDateClick }) {
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    // Start from 12 weeks ago, on a Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (12 * 7) - today.getDay());
    
    // Create a set of dates that have notes
    const activeDates = new Set();
    notes.forEach(n => {
      const d = new Date(n.created_at || n.id);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      activeDates.add(dateStr);
    });

    const grid = [];
    const monthLabels = [];
    let currentMonth = -1;

    // 7 rows (Sun-Sat), 13 cols (12 weeks + current week)
    for (let row = 0; row < 7; row++) {
      const weekRow = [];
      for (let col = 0; col < 13; col++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + (col * 7) + row);
        
        // Month label logic (only add to first row)
        if (row === 0 && d.getMonth() !== currentMonth) {
          monthLabels.push({ col, label: d.toLocaleDateString('en-US', { month: 'short' }) });
          currentMonth = d.getMonth();
        }

        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const isFuture = d > today;
        const isActive = activeDates.has(dateStr);
        const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        
        weekRow.push({ date: d, dateStr, isActive, isFuture, isToday });
      }
      grid.push(weekRow);
    }
    
    return { grid, monthLabels };
  }, [notes]);

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <span className="heatmap-title">Daily Checklist Streak</span>
      </div>
      <div className="heatmap-wrapper">
        <div className="heatmap-months">
          {monthLabels.map((m, i) => (
             <span key={i} style={{ left: `calc(${m.col} * (10px + 3px))` }}>{m.label}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {grid.map((row, r) => (
            <div key={r} className="heatmap-row">
              {row.map((cell, c) => (
                <div 
                  key={c}
                  className={`heatmap-cell ${cell.isActive ? 'active' : ''} ${cell.isFuture ? 'future' : ''} ${cell.isToday ? 'today' : ''}`}
                  title={`${cell.dateStr} ${cell.isActive ? '(Completed)' : cell.isFuture ? '' : '(Missed)'}`}
                  onClick={() => !cell.isFuture && onDateClick(cell.dateStr)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
