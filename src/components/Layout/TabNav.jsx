import { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'tab-execute', label: 'Execution Engine' },
  { id: 'tab-analytics', label: 'Analytics & Heatmap' },
  { id: 'tab-playbook', label: 'Chart Playbook' },
  { id: 'tab-risk', label: 'Risk & Drawdown' },
  { id: 'tab-system', label: 'Trading System' },
  { id: 'tab-mistakes', label: 'Mistake Receipts' },
  { id: 'tab-confident', label: 'Confident Receipts' },
  { id: 'tab-mindset', label: 'Mindset & Lessons' },
  { id: 'tab-journal', label: 'Journal / Notes' },
  { id: 'tab-quotes', label: 'Daily Quote' },
];

export default function TabNav({ activeTab, onTabChange }) {
  const navRef = useRef(null);
  const currentIndex = TABS.findIndex(t => t.id === activeTab);

  const onTabLeft = () => {
    if (currentIndex > 0) {
      onTabChange(TABS[currentIndex - 1].id);
    }
  };

  const onTabRight = () => {
    if (currentIndex < TABS.length - 1) {
      onTabChange(TABS[currentIndex + 1].id);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore key events if user is focused inside input elements or editor
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable ||
        activeEl.closest('.journal-editor')
      )) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onTabLeft();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onTabRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]); // Re-attach when currentIndex changes so handlers use updated values

  // Auto-scroll active tab into view
  useEffect(() => {
    if (navRef.current) {
      const activeBtn = navRef.current.querySelector('.tab-btn.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="tab-nav-container">
      <button 
        className="nav-arrow-btn" 
        onClick={onTabLeft} 
        disabled={currentIndex === 0}
        title="Previous Tab (Left Arrow Key)"
      >
        <ChevronLeft size={16} />
      </button>

      <div ref={navRef} className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <button 
        className="nav-arrow-btn" 
        onClick={onTabRight} 
        disabled={currentIndex === TABS.length - 1}
        title="Next Tab (Right Arrow Key)"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
