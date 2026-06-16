import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Music, Eye, EyeOff, AlertCircle, Check, Loader2, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/type');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      await login(email, password);
      setSuccessMsg('Welcome back! Redirecting…');
      setTimeout(() => navigate('/type'), 800);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (status === 401 || status === 400) {
        setError('Incorrect email or password. Please try again.');
      } else if (status === 404) {
        setError('No account found with this email. Would you like to sign up?');
      } else {
        setError(serverMsg || 'Something went wrong. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #312e81 100%)',
      backgroundAttachment: 'fixed',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Back link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#64748b', fontSize: '0.82rem', fontWeight: 500,
            textDecoration: 'none', marginBottom: 32,
            transition: 'color 0.2s', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={14} /> Back to home
        </Link>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Muse<span style={{ color: '#c084fc' }}>Type</span>
          </div>
          <h1 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.5rem', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Log in to continue your practice sessions
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24, padding: 36,
        }}>
          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 20,
            }}>
              <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: '#fca5a5', fontSize: '0.84rem', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 20,
            }}>
              <Check size={16} style={{ color: '#34d399' }} />
              <span style={{ color: '#6ee7b7', fontSize: '0.84rem' }}>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: 7, letterSpacing: '0.08em' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                  PASSWORD
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ marginTop: 6 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in…
                </span>
              ) : '🎹 Log In'}
            </button>
          </form>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />

          <p style={{ color: '#4b5563', fontSize: '0.83rem', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{ color: '#eab308', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Sign up free →
            </Link>
          </p>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
