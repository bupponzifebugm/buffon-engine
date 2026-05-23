import { Sun, Moon, LogOut, Calendar } from 'lucide-react';
import { fmtDate, getTodayString } from '../../lib/utils';

export default function Header({ profile, tierConfig, onToggleDark, isDark, onSignOut }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div>
            <div className="logo-text">
              BUFFON <span className="sep">/</span> EXECUTION ENGINE <span className="sep">/</span> v4.0
            </div>
            <div className="title-block" style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <h1>Capital & Protocol System</h1>
              <div className="header-date" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
                <Calendar size={14} style={{ color: 'var(--accent)' }} />
                <span>{fmtDate(getTodayString())}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            {tierConfig && (
              <div className={`badge ${tierConfig.badgeColor}`}>
                {tierConfig.badge} ({tierConfig.riskPct}%)
              </div>
            )}
            <button
              className="dark-toggle"
              onClick={onToggleDark}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="logout-btn" onClick={onSignOut}>
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
