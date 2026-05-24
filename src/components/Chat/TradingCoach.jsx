import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Settings, Send, Brain, Key, AlertTriangle } from 'lucide-react';
import { COACH_SYSTEM_PROMPT } from '../../lib/coachPrompt';
import './TradingCoach.css';

export default function TradingCoach({ 
  profile, 
  positions, 
  todaysGate, 
  cleanStreak, 
  tierConfig, 
  dailyPnl, 
  weeklyPnl,
  ugmStatus
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('buffon_gemini_api_key') || '');
  const [isConfiguring, setIsConfiguring] = useState(!localStorage.getItem('buffon_gemini_api_key'));
  const [tempKey, setTempKey] = useState('');
  
  const [messages, setMessages] = useState([
    { role: 'model', content: "I'm Buffon AI. I know your rules, your sizing, and your UGM schedule. Are you here to follow the system or donate money to the market today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('buffon_gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setIsConfiguring(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('buffon_gemini_api_key');
    setApiKey('');
    setTempKey('');
    setIsConfiguring(true);
  };

  const constructDynamicContext = () => {
    const recent = (positions || []).slice(0, 5).map(p => 
      `- ${p.ticker} | PnL: Rp ${p.pnl || 0} | Process: ${p.process_score} | Violation: ${p.is_violation ? p.violation_reason : 'None'}`
    ).join('\n');

    return `
=== LIVE TRADING DATA (${new Date().toLocaleString()}) ===
Current Capital: Rp ${tierConfig?.capital || 25000000}
Active Tier: ${tierConfig?.badge || 'Survival'}
Today's PnL: Rp ${dailyPnl || 0}
Weekly PnL: Rp ${weeklyPnl || 0}
Clean Streak: ${cleanStreak || 0}
Today's Gate Focus Score: ${todaysGate?.focus_score || 'Not completed'}
Today's Gate USD/IDR: ${todaysGate?.usd_idr_rate || 'Unknown'}
Today's Gate Macro: ${todaysGate?.macro_env || 'Unknown'}
UGM Class Status: ${ugmStatus?.isObservationMode ? 'In Class/Observation (' + ugmStatus.currentClass + ')' : 'Free to trade'}

Recent Trades (last 5):
${recent || 'No recent trades logged.'}
`;
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const fullSystemInstruction = COACH_SYSTEM_PROMPT + '\n\n' + constructDynamicContext();

    const apiMessages = messages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    
    apiMessages.push({ role: 'user', parts: [{ text: userMessage }] });

    const payload = {
      systemInstruction: { parts: [{ text: fullSystemInstruction }] },
      contents: apiMessages
    };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'model', content: `API Error: ${data.error.message}` }]);
      } else if (data.candidates && data.candidates[0].content) {
        const botReply = data.candidates[0].content.parts[0].text;
        setMessages(prev => [...prev, { role: 'model', content: botReply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Network error. Make sure your internet is working and the API key is valid." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
  };

  const parseMarkdown = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ backgroundColor: 'var(--bg-secondary)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'monospace' }}>{part.slice(1, -1)}</code>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Toggle Button on the right edge */}
      <div 
        className="ai-coach-toggle-btn" 
        onClick={() => setIsOpen(true)}
      >
        <Brain size={18} />
        <span>AI COACH</span>
      </div>

      {/* Overlay */}
      <div 
        className={`ai-coach-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-out Drawer */}
      <div className={`ai-coach-drawer ${isOpen ? 'open' : ''}`}>
        
        <div className="ai-coach-header">
          <div className="ai-coach-title">
            <Brain size={20} color="var(--accent)" />
            <h2>Buffon AI</h2>
            <div className="ai-coach-status">
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: apiKey ? 'var(--success)' : 'var(--warning)', display: 'inline-block' }}></span>
              {apiKey ? 'Active' : 'Setup Required'}
            </div>
          </div>
          <div className="ai-coach-actions">
            <button className="ai-coach-btn" onClick={() => setIsConfiguring(!isConfiguring)}>
              <Settings size={18} />
            </button>
            <button className="ai-coach-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {isConfiguring ? (
          <div className="ai-coach-setup">
            <Key size={48} color="var(--text-secondary)" style={{ margin: '0 auto' }} />
            <h3>Connect Gemini API</h3>
            <p>Paste your free Gemini API key below. It is stored securely in your browser's local storage and never leaves your device.</p>
            <input 
              type="password"
              className="input-field"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <button className="btn-primary" onClick={handleSaveKey}>Save Key</button>
            {apiKey && (
              <button 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--danger)', marginTop: 8 }}
                onClick={handleClearKey}
              >
                Clear Existing Key
              </button>
            )}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', marginTop: 12 }}
            >
              Get a free API key here
            </a>
          </div>
        ) : (
          <>
            <div className="ai-coach-chat-area">
              <div className="ai-system-message">
                Buffon AI connected. Live trading stats attached.
              </div>
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`ai-message ${msg.role}`}>
                  <div className="ai-message-content">
                    {parseMarkdown(msg.content)}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="ai-message bot">
                  <div className="ai-message-content ai-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-coach-input-area">
              <div className="ai-suggestion-chips">
                <div className="ai-chip" onClick={() => handleSuggestion('Should I trade right now? Check my stats.')}>Should I trade?</div>
                <div className="ai-chip" onClick={() => handleSuggestion('Critique my last trade.')}>Critique last trade</div>
                <div className="ai-chip" onClick={() => handleSuggestion('I feel like revenge trading.')}>I feel like revenge trading</div>
                <div className="ai-chip" onClick={() => handleSuggestion('Remind me of the sizing rules.')}>Sizing rules</div>
              </div>
              
              <div className="ai-input-wrapper">
                <textarea 
                  placeholder="Ask your coach..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button 
                  className="ai-send-btn" 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
