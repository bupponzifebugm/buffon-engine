const TABS = [
  { id: 'tab-execute', label: 'Execution Engine' },
  { id: 'tab-analytics', label: 'Analytics & Heatmap' },
  { id: 'tab-risk', label: 'Risk & Drawdown' },
  { id: 'tab-system', label: 'Trading System' },
  { id: 'tab-mistakes', label: 'Mistake Receipts' },
  { id: 'tab-confident', label: 'Confident Receipts' },
  { id: 'tab-mindset', label: 'Mindset & Lessons' },
  { id: 'tab-journal', label: 'Journal / Notes' },
  { id: 'tab-quotes', label: 'Daily Quote' },
];

export default function TabNav({ activeTab, onTabChange }) {
  return (
    <div className="tab-nav">
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
  );
}
