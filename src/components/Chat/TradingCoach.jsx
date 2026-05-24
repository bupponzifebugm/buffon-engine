import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Settings, Send, Brain, Key, Clock, Plus } from 'lucide-react';
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
  ugmStatus}) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('buffon_gemini_api_key') || '');
  const [isConfiguring, setIsConfiguring] = useState(!localStorage.getItem('buffon_gemini_api_key'));
  const [tempKey, setTempKey] = useState('');
  
  // Chat History DB State
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('buffon_ai_chats');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [activeChatId, setActiveChatId] = useState(generateId());
  const [showHistory, setShowHistory] = useState(false);

  // Resizer state
  const [drawerWidth, setDrawerWidth] = useState(() => parseInt(localStorage.getItem('buffon_coach_width')) || 450);
  const isResizing = useRef(false);
  const widthRef = useRef(drawerWidth);

  useEffect(() => {
    widthRef.current = drawerWidth;
  }, [drawerWidth]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 320 && newWidth < window.innerWidth * 0.9) {
        setDrawerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        localStorage.setItem('buffon_coach_width', widthRef.current);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const defaultMessages = [
    { role: 'model', content: "I'm Buffon AI. I know your rules, your sizing, and your UGM schedule. Are you here to follow the system or donate money to the market today?" }
  ];
  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicChips, setDynamicChips] = useState([
    'Should I trade right now? Check my stats.',
    'Critique my last trade.',
    'I feel like revenge trading.'
  ]);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && !showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showHistory]);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem('buffon_ai_chats', JSON.stringify(conversations));
  }, [conversations]);

  // Resizer Logic
  const handleMouseDown = (e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < window.innerWidth * 0.9) {
      setDrawerWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    localStorage.setItem('buffon_coach_width', drawerWidth);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

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

  const handleNewChat = () => {
    setActiveChatId(generateId());
    setMessages(defaultMessages);
    setShowHistory(false);
    setDynamicChips(['Should I trade right now?', 'Review my psychology', 'Remind me of sizing rules']);
  };

  const handleLoadChat = (conv) => {
    setActiveChatId(conv.id);
    setMessages(conv.messages);
    setShowHistory(false);
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
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    const INTERNAL_PREAMBLE = `Before every response, internally assess:
1. What is the user's emotional state?
2. What do they actually need vs what they asked?
3. Is this a behavioral violation I should flag?
4. What would Hengky Adinata say about this?
Then respond.

CRITICAL INSTRUCTION: Always append a JSON block at the very end of your response formatted exactly like this:
\`\`\`json
{
  "suggested_actions": ["Option 1", "Option 2", "Option 3"]
}
\`\`\`
`;
    const fullSystemInstruction = INTERNAL_PREAMBLE + COACH_SYSTEM_PROMPT + '\n\n' + constructDynamicContext();

    const apiMessages = updatedMessages.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = {
      systemInstruction: { parts: [{ text: fullSystemInstruction }] },
      contents: apiMessages,
      generationConfig: {
        temperature: 0.7
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.error) {
        const errorMsg = `API Error: ${data.error.message}`;
        setMessages([...updatedMessages, { role: 'model', content: errorMsg }]);
      } else if (data.candidates && data.candidates[0].content) {
        const botReplyRaw = data.candidates[0].content.parts[0].text;
        
        let cleanReply = botReplyRaw;
        let extractedSuggestions = [];
        
        // Extract JSON block for chips
        const jsonMatch = botReplyRaw.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.suggested_actions && Array.isArray(parsed.suggested_actions)) {
              extractedSuggestions = parsed.suggested_actions;
            }
            cleanReply = botReplyRaw.replace(jsonMatch[0], '').trim();
          } catch(e) {
            console.error("Failed to parse JSON suggestions", e);
          }
        }
        
        if (extractedSuggestions.length > 0) {
          setDynamicChips(extractedSuggestions);
        }

        const finalMessages = [...updatedMessages, { role: 'model', content: cleanReply }];
        setMessages(finalMessages);

        // Update Conversations DB
        setConversations(prev => {
          const existing = prev.find(c => c.id === activeChatId);
          if (existing) {
            return prev.map(c => c.id === activeChatId ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() } : c);
          } else {
            return [{
              id: activeChatId,
              title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
              messages: finalMessages,
              updatedAt: new Date().toISOString()
            }, ...prev];
          }
        });
      }
    } catch (err) {
      setMessages([...updatedMessages, { role: 'model', content: "Network error. Make sure your internet is working and the API key is valid." }]);
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
      <div className="ai-coach-toggle-btn" onClick={() => setIsOpen(true)}>
        <Brain size={18} />
        <span>AI COACH</span>
      </div>

      <div className={`ai-coach-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />

      <div 
        className={`ai-coach-drawer ${isOpen ? 'open' : ''}`}
        style={{ width: `${drawerWidth}px` }}
      >
        <div className="ai-drawer-resizer" onMouseDown={() => isResizing.current = true} />
        
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
            {!isConfiguring && (
              <button 
                className="ai-coach-btn" 
                onClick={() => setShowHistory(!showHistory)}
                title="Chat History"
                style={{ backgroundColor: showHistory ? 'var(--bg-secondary)' : 'transparent' }}
              >
                <Clock size={18} />
              </button>
            )}
            <button className="ai-coach-btn" onClick={() => setIsConfiguring(!isConfiguring)} title="Settings">
              <Settings size={18} />
            </button>
            <button className="ai-coach-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* History Sidebar Panel */}
        <div className={`ai-coach-history-panel ${showHistory ? 'open' : ''}`}>
          <div className="ai-history-header">
            <h3 style={{ fontSize: 14, margin: 0 }}>Conversation History</h3>
            <button 
              className="ai-coach-btn" 
              onClick={handleNewChat}
              style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '4px 8px' }}
            >
              <Plus size={16} style={{ marginRight: 4 }} /> New Chat
            </button>
          </div>
          <div className="ai-history-list">
            {conversations.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                No past conversations.
              </div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id} 
                  className={`ai-history-item ${activeChatId === conv.id ? 'active' : ''}`}
                  onClick={() => handleLoadChat(conv)}
                >
                  <div className="ai-history-item-date">
                    {new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="ai-history-item-preview">
                    {conv.title}
                  </div>
                </div>
              ))
            )}
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
                {dynamicChips.map((chipText, i) => (
                  <div key={i} className="ai-chip" onClick={() => setInput(chipText)}>
                    {chipText}
                  </div>
                ))}
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
