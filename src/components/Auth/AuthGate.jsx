import { useState } from 'react';
import { Lock, Mail, ArrowRight, HardDrive, AlertCircle } from 'lucide-react';

export default function AuthGate({ onSignIn, onSignUp, onLoginOffline }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = isLogin
        ? await onSignIn(email, password)
        : await onSignUp(email, password);

      if (authError) {
        if (authError.message?.toLowerCase().includes('failed to fetch') || authError.message?.toLowerCase().includes('network')) {
          setError('Supabase connection failed (Project may be paused or offline). You can click "Continue in Local Mode" below to trade immediately!');
        } else {
          setError(authError.message);
        }
      }
    } catch (err) {
      setError('Connection error. You can use Local Mode to access your trading engine offline.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="loading-screen">
      <div className="auth-container" style={{ maxWidth: '420px' }}>
        <div className="auth-logo">
          BUFFON <span className="sep">/</span> EXECUTION ENGINE <span className="sep">/</span> v4.0
        </div>
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to access your execution engine.' : 'Set up your trading command center.'}
        </p>

        {error && (
          <div className="auth-error" style={{ fontSize: '12px', lineHeight: '1.5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="buffonfebugm@gmail.com"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Connecting...' : (isLogin ? 'Sign In with Supabase' : 'Create Account')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Offline / Local Mode Button */}
        {onLoginOffline && (
          <button 
            type="button" 
            onClick={onLoginOffline}
            className="btn" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-strong)',
              display: 'flex',
              gap: '8px',
              fontWeight: '700'
            }}
          >
            <HardDrive size={16} style={{ color: 'var(--accent)' }} />
            Continue in Local / Offline Mode
          </button>
        )}

        <div className="auth-toggle" style={{ marginTop: '20px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
