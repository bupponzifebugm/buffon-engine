import { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function AuthGate({ onSignIn, onSignUp }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isLogin
      ? await onSignIn(email, password)
      : await onSignUp(email, password);

    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  }

  return (
    <div className="loading-screen">
      <div className="auth-container">
        <div className="auth-logo">
          BUFFON <span className="sep">/</span> EXECUTION ENGINE <span className="sep">/</span> v4.0
        </div>
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to access your execution engine.' : 'Set up your trading command center.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="trader@buffon.com"
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
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
