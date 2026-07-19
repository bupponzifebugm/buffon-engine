import { useState } from 'react';
import { CheckCircle, Circle, AlertTriangle, Bot, List, Zap, Shield, Layers } from 'lucide-react';
import { DAILY_CHECKLIST, BOT_STACK_RULES } from '../../lib/constants';

export default function TradingSystem() {
  const [checklistState, setChecklistState] = useState(
    () => DAILY_CHECKLIST.map(() => false)
  );
  const [botCheckState, setBotCheckState] = useState(
    () => BOT_STACK_RULES.map(() => false)
  );
  const [showBot, setShowBot] = useState(false);

  function toggleChecklist(i) {
    setChecklistState(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function toggleBotCheck(i) {
    setBotCheckState(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  const preFlightChecks = [
    { idx: 0, label: DAILY_CHECKLIST[0] },
    { idx: 1, label: DAILY_CHECKLIST[1] },
    { idx: 2, label: DAILY_CHECKLIST[2] },
    { idx: 3, label: DAILY_CHECKLIST[3] }
  ];

  const selectionChecks = [
    { idx: 4, label: DAILY_CHECKLIST[4] },
    { idx: 6, label: DAILY_CHECKLIST[6] },
    { idx: 7, label: DAILY_CHECKLIST[7] }
  ];

  const executionChecks = [
    { idx: 5, label: DAILY_CHECKLIST[5] },
    { idx: 8, label: DAILY_CHECKLIST[8] },
    { idx: 9, label: DAILY_CHECKLIST[9] }
  ];

  const isPreFlightComplete = checklistState[0] && checklistState[1] && checklistState[2] && checklistState[3];
  const isSelectionComplete = checklistState[4] && checklistState[6] && checklistState[7];
  const isExecutionComplete = checklistState[5] && checklistState[8] && checklistState[9];
  const allChecked = isPreFlightComplete && isSelectionComplete && isExecutionComplete;

  const getChecklistBtnStyle = (checked) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 12px',
    background: checked ? 'rgba(52, 211, 153, 0.08)' : 'var(--bg-primary)',
    border: '1px solid',
    borderColor: checked ? 'var(--success)' : 'var(--border)',
    borderRadius: '6px',
    color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box'
  });

  const botDone = botCheckState.filter(Boolean).length;

  return (
    <div>
      {/* ── RPG SYSTEM CHECKLIST SKILL TREE ── */}
      <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} style={{ color: 'var(--accent)' }} />
          System Launch Status (RPG Skill Tree)
        </div>

        {/* Central Engine indicator */}
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          marginBottom: '24px',
          boxShadow: allChecked ? '0 0 25px rgba(52, 211, 153, 0.25)' : 'none',
          borderColor: allChecked ? 'var(--success)' : 'var(--border)',
          transition: 'all 0.4s'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>Central Launch Indicator</div>
          <div style={{
            fontSize: '20px',
            fontWeight: '900',
            marginTop: '6px',
            color: allChecked ? 'var(--success)' : 'var(--text-secondary)',
            textShadow: allChecked ? '0 0 10px rgba(52, 211, 153, 0.4)' : 'none'
          }}>
            {allChecked ? '⚡ LAUNCH ENGINE READY' : '🔒 ENGINE LOCKOUT'}
          </div>
        </div>

        {/* SVG Skill Tree Path network */}
        <svg viewBox="0 0 600 40" className="skill-tree-network-svg" style={{ width: '100%', height: '40px' }}>
          {/* Path 1: Pre-Flight (Left) */}
          <path
            d="M 300 0 L 300 15 L 100 15 L 100 40"
            fill="none"
            stroke={isPreFlightComplete ? 'var(--success)' : 'var(--border)'}
            strokeWidth="3"
            style={{
              transition: 'stroke 0.4s, filter 0.4s',
              filter: isPreFlightComplete ? 'drop-shadow(0 0 5px var(--success))' : 'none'
            }}
          />
          {/* Path 2: Selection (Center) */}
          <path
            d="M 300 0 L 300 40"
            fill="none"
            stroke={isSelectionComplete ? 'var(--success)' : 'var(--border)'}
            strokeWidth="3"
            style={{
              transition: 'stroke 0.4s, filter 0.4s',
              filter: isSelectionComplete ? 'drop-shadow(0 0 5px var(--success))' : 'none'
            }}
          />
          {/* Path 3: Execution (Right) */}
          <path
            d="M 300 0 L 300 15 L 500 15 L 500 40"
            fill="none"
            stroke={isExecutionComplete ? 'var(--success)' : 'var(--border)'}
            strokeWidth="3"
            style={{
              transition: 'stroke 0.4s, filter 0.4s',
              filter: isExecutionComplete ? 'drop-shadow(0 0 5px var(--success))' : 'none'
            }}
          />

          {/* Node dot glow emitters */}
          <circle cx="300" cy="0" r="5" fill={allChecked ? 'var(--success)' : 'var(--border)'} style={{ transition: 'fill 0.4s' }} />
          <circle cx="100" cy="40" r="4" fill={isPreFlightComplete ? 'var(--success)' : 'var(--border)'} style={{ transition: 'fill 0.4s' }} />
          <circle cx="300" cy="40" r="4" fill={isSelectionComplete ? 'var(--success)' : 'var(--border)'} style={{ transition: 'fill 0.4s' }} />
          <circle cx="500" cy="40" r="4" fill={isExecutionComplete ? 'var(--success)' : 'var(--border)'} style={{ transition: 'fill 0.4s' }} />
        </svg>

        {/* The 3 Branches Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Branch 1: Pre-Flight */}
          <div style={{
            padding: '16px',
            background: isPreFlightComplete ? 'rgba(52, 211, 153, 0.03)' : 'var(--bg-secondary)',
            border: '1px solid',
            borderColor: isPreFlightComplete ? 'var(--success)' : 'var(--border)',
            borderRadius: '10px',
            boxShadow: isPreFlightComplete ? '0 0 15px rgba(52, 211, 153, 0.1)' : 'none',
            transition: 'all 0.3s',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Shield size={16} style={{ color: isPreFlightComplete ? 'var(--success)' : 'var(--text-secondary)' }} />
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: isPreFlightComplete ? 'var(--success)' : 'var(--text-primary)' }}>1. PRE-FLIGHT PATH</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {preFlightChecks.map(item => (
                <button
                  key={item.idx}
                  onClick={() => toggleChecklist(item.idx)}
                  style={getChecklistBtnStyle(checklistState[item.idx])}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: checklistState[item.idx] ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', color: checklistState[item.idx] ? 'var(--success)' : 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold', marginRight: '6px', flexShrink: 0 }}>
                    {checklistState[item.idx] ? '✓' : item.idx + 1}
                  </span>
                  <span style={{ textAlign: 'left', fontSize: '12px' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Branch 2: Selection */}
          <div style={{
            padding: '16px',
            background: isSelectionComplete ? 'rgba(52, 211, 153, 0.03)' : 'var(--bg-secondary)',
            border: '1px solid',
            borderColor: isSelectionComplete ? 'var(--success)' : 'var(--border)',
            borderRadius: '10px',
            boxShadow: isSelectionComplete ? '0 0 15px rgba(52, 211, 153, 0.1)' : 'none',
            transition: 'all 0.3s',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={16} style={{ color: isSelectionComplete ? 'var(--success)' : 'var(--text-secondary)' }} />
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: isSelectionComplete ? 'var(--success)' : 'var(--text-primary)' }}>2. SELECTION PATH</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectionChecks.map(item => (
                <button
                  key={item.idx}
                  onClick={() => toggleChecklist(item.idx)}
                  style={getChecklistBtnStyle(checklistState[item.idx])}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: checklistState[item.idx] ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', color: checklistState[item.idx] ? 'var(--success)' : 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold', marginRight: '6px', flexShrink: 0 }}>
                    {checklistState[item.idx] ? '✓' : item.idx + 1}
                  </span>
                  <span style={{ textAlign: 'left', fontSize: '12px' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Branch 3: Execution */}
          <div style={{
            padding: '16px',
            background: isExecutionComplete ? 'rgba(52, 211, 153, 0.03)' : 'var(--bg-secondary)',
            border: '1px solid',
            borderColor: isExecutionComplete ? 'var(--success)' : 'var(--border)',
            borderRadius: '10px',
            boxShadow: isExecutionComplete ? '0 0 15px rgba(52, 211, 153, 0.1)' : 'none',
            transition: 'all 0.3s',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Zap size={16} style={{ color: isExecutionComplete ? 'var(--success)' : 'var(--text-secondary)' }} />
              <span style={{ fontWeight: 'bold', fontSize: '13px', color: isExecutionComplete ? 'var(--success)' : 'var(--text-primary)' }}>3. EXECUTION PATH</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {executionChecks.map(item => (
                <button
                  key={item.idx}
                  onClick={() => toggleChecklist(item.idx)}
                  style={getChecklistBtnStyle(checklistState[item.idx])}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '50%', background: checklistState[item.idx] ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)', color: checklistState[item.idx] ? 'var(--success)' : 'var(--text-secondary)', fontSize: '10px', fontWeight: 'bold', marginRight: '6px', flexShrink: 0 }}>
                    {checklistState[item.idx] ? '✓' : item.idx + 1}
                  </span>
                  <span style={{ textAlign: 'left', fontSize: '12px' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AlgoTrade Bot Priority Stack ── */}
      <div className="card">
        <div className="card-title">
          <Bot size={16} style={{ color: 'var(--accent)' }} />
          AlgoTrade Bot Priority Stack ({botDone}/{BOT_STACK_RULES.length})
        </div>
        <button
          className="btn secondary"
          style={{ marginTop: 0, marginBottom: 16 }}
          onClick={() => setShowBot(!showBot)}
        >
          {showBot ? 'Hide Bot Checklist' : 'Open Bot Filter Checklist'}
        </button>
        {showBot && (
          <div className="checklist-grid">
            {BOT_STACK_RULES.map((item, i) => (
              <button
                key={i}
                className={`checklist-item${botCheckState[i] ? ' checked' : ''}`}
                onClick={() => toggleBotCheck(i)}
              >
                {botCheckState[i]
                  ? <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  : <Circle size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                }
                <span className="checklist-step">{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{item.rule}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.detail}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 2-Day Confirmation Rule ── */}
      <div className="card">
        <div className="card-title">2-Day Confirmation Rule (Survival Mode)</div>
        <div className="confirmation-timeline">
          <div className="conf-step">
            <div className="conf-day">DAY 1</div>
            <div className="conf-desc">Bot flags ticker. Score 80+. AK/CC buying. Asing neutral/buying. <b>Do NOT enter.</b></div>
          </div>
          <div className="conf-arrow">→</div>
          <div className="conf-step">
            <div className="conf-day">DAY 2</div>
            <div className="conf-desc">Same pattern holds. YP not dominant. Volume still elevated. <b>Confirm interest.</b></div>
          </div>
          <div className="conf-arrow">→</div>
          <div className="conf-step active">
            <div className="conf-day">DAY 3</div>
            <div className="conf-desc">Price pulls back to entry zone → <b>ENTER.</b> SL immediately. Follow formula.</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 12, fontWeight: 600 }}>
          <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Exception: Score 90+ STRONG_ACCUMULATION + asing buying = 1-day OK.
        </div>
      </div>

      {/* ── Existing System Reference Cards ── */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">Pre-Market & Algo Bot Stack</div>
          <ul className="system-list">
            <li><span><b>IHSG Regime:</b> If IHSG red → passive → wait for rebound, 2-3% profit max. If green → can go aggressive.</span></li>
            <li><span><b>Bot Score:</b> Must be ≥ 80. Below 75 is an instant fail. Do not rationalize.</span></li>
            <li><span><b>Stage:</b> Must be EARLY_SETUP or EARLY_CONFIRM. LATE/EXTENDED/DISTRIBUTION = skip.</span></li>
            <li><span><b style={{ color: 'var(--danger)' }}>Asing (Foreign):</b> Must be BUYING or Neutral. SELLING = INSTANT SKIP.</span></li>
            <li><span><b>Bandarmology:</b> Broker summary must show green buy acc. Bandar must be stuck at higher price. AVOID distribution stocks.</span></li>
            <li><span><b>YP Position:</b> YP must NOT be dominant buyer. YP #1 = retail late signal = skip.</span></li>
            <li><span><b>Divergence:</b> Look for bullish divergence — price lower lows, indicator higher lows = hidden strength.</span></li>
            <li><span><b>IHSG Rotation:</b> Identify which sector/conglomerate chain is being rotated into.</span></li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title">Execution & Psychology Rules</div>
          <ul className="system-list">
            <li><span><b>Trading Hours:</b> 08:30 – 10:30 WIB max. Hard close 09:30 class days, 11:00 free days.</span></li>
            <li><span><b>Red Day Protocol:</b> 2-3% profit is MORE than enough. Wait min 1hr after 09:00. Half size or skip.</span></li>
            <li><span><b>SL Reflex:</b> SL placed IMMEDIATELY after fill. Use bot SL (ATR-based, 4-7%). Never move further.</span></li>
            <li><span><b>Rule 1:</b> Follow system, but loss is still a win (if process correct).</span></li>
            <li><span><b>Rule 2:</b> No revenge trade. Ever. Position 2 is always worse than position 1.</span></li>
            <li><span><b>Rule 3:</b> No unplanned trades. Not on watchlist = skip.</span></li>
            <li><span><b>Rule 4:</b> Discipline in your life = discipline in trading. Check energy levels.</span></li>
            <li><span><b>Rule 5:</b> No entering at pucuk. Missed entry = move on.</span></li>
            <li><span><b>Rule 6:</b> Do not move stop loss after placement. Never average down.</span></li>
            <li><span><b>Rule 7:</b> Cut loss adalah self love. No trade is the best choice when conditions aren't right.</span></li>
          </ul>
        </div>
      </div>

      {/* ── Entry Checklist (All Must Pass) ── */}
      <div className="card">
        <div className="card-title">Entry Checklist (ALL Must Pass)</div>
        <ul className="system-list">
          <li><span><b>1.</b> Was this on last night's watchlist? (Not spotted after open)</span></li>
          <li><span><b>2.</b> Is price inside pre-marked entry zone? (Not chasing)</span></li>
          <li><span><b>3.</b> Am I executing a plan or chasing FOMO? (Honest answer)</span></li>
          <li><span><b>4.</b> IDR check done → risk % confirmed for today?</span></li>
          <li><span><b>5.</b> Orderbook readable and clean?</span></li>
          <li><span style={{ color: 'var(--danger)', fontWeight: 700 }}>ANY FAIL = SKIP. No exceptions.</span></li>
        </ul>
      </div>

      {/* ── Sector Rotation Playbook ── */}
      <div className="card">
        <div className="card-title">Sector Rotation Playbook</div>
        <div className="table-responsive">
          <table className="system-table">
            <thead>
              <tr>
                <th>Rotation Type</th>
                <th>How to Identify Early</th>
                <th>Entry Window</th>
                <th>Exit Signal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Conglomerate Chain</b></td>
                <td>Bakrie (BNBR) → Pak PP (PTRO, BRPT, CDIA) → Hapsoro (MINA, BUVA) → ZATA, BELL. One group pumps → next is the entry.</td>
                <td>Identify next group before pump.</td>
                <td>YP becomes dominant (distribution).</td>
              </tr>
              <tr>
                <td><b>MBG Beneficiary</b></td>
                <td>Govt contract news / disbursement.</td>
                <td>Food/Logistics on day of news.</td>
                <td>Volume drops back to average.</td>
              </tr>
              <tr>
                <td><b>Commodity Spike</b></td>
                <td>Global price move &gt;3% overnight.</td>
                <td>MEDC, ADRO type on open.</td>
                <td>Commodity price reverses.</td>
              </tr>
              <tr>
                <td><b>Defensive Rotation</b></td>
                <td>IHSG red 3+ days, high fear.</td>
                <td>TLKM, Consumer staples on dip.</td>
                <td>IHSG stabilizes, risk-on returns.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Drawdown Protocol Reference ── */}
      <div className="card">
        <div className="card-title">Drawdown Protocol (Hard Rules)</div>
        <ul className="system-list">
          <li><span><b>Daily -2% (Rp 500k):</b> Close Stockbit. Session over.</span></li>
          <li><span><b>2 consecutive stops:</b> Session over. Do not reopen.</span></li>
          <li><span><b>Weekly -3% (Rp 750k):</b> Next week survival mode regardless of IDR.</span></li>
          <li><span><b>Monthly -7% (Rp 1.75M):</b> Pause 5 days. Full journal review.</span></li>
          <li><span><b style={{ color: 'var(--danger)' }}>Running -10% (Rp 2.5M):</b> Drop to 10M mode immediately.</span></li>
          <li><span><b style={{ color: 'var(--danger)' }}>Running -15% (Rp 3.75M):</b> Full stop. Mentor review.</span></li>
          <li><span><b style={{ color: 'var(--danger)' }}>Running -20% (Rp 5M):</b> Back to 762k training mode. Full rebuild.</span></li>
        </ul>
      </div>

      {/* ── Stock Universe ── */}
      <div className="card">
        <div className="card-title">Stock Universe</div>
        <div className="grid-2">
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 8, textTransform: 'uppercase' }}>Primary Focus</div>
            <ul className="system-list">
              <li><span>Any bot pick with score 80+, EARLY stage, asing buying, AK/CC accumulation.</span></li>
              <li><span>Mid-cap range Rp 100–2,000 preferred (more movement, domestic bandar driven).</span></li>
              <li><span>Must pass 2-day confirmation before entry at 25M scale.</span></li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 8, textTransform: 'uppercase' }}>Avoid List</div>
            <ul className="system-list">
              <li><span>Notasi Khusus stocks after 500%+ run (WBSA-type post-pump).</span></li>
              <li><span>Low liquidity stocks &lt;Rp 5B daily volume.</span></li>
              <li><span>Stocks with pending corporate actions (right issue, cum-date).</span></li>
              <li><span>MG-dominated tickers without AK/CC confirmation.</span></li>
              <li><span>Any ticker NOT on pre-planned watchlist.</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
