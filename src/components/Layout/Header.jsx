import { Sun, Moon, LogOut } from 'lucide-react';

export default function Header({ profile, tierConfig, onToggleDark, isDark, onSignOut }) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <div>
            <div className="logo-text">
              BUFFON <span className="sep">/</span> EXECUTION ENGINE <span className="sep">/</span> v4.0
            </div>
            <div className="title-block">
              <h1>Capital & Protocol System</h1>
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
