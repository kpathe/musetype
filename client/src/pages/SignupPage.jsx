import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Eye, EyeOff, AlertCircle, Check, Loader2, ArrowLeft } from 'lucide-react';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/type');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim()) { setError('Please choose a username.'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters long.'); return; }
    if (confirmPassword && password !== confirmPassword) { setError('Passwords do not match. Please try again.'); return; }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      setSuccessMsg('Account created! Taking you to the app…');
      setTimeout(() => navigate('/type'), 900);
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (status === 409) {
        setError('An account with this email or username already exists. Try logging in instead.');
      } else if (status === 422) {
        setError(serverMsg || 'Please check your inputs and try again.');
      } else {
        setError(serverMsg || 'Something went wrong. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', '#f87171', '#f59e0b', '#34d399'];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #312e81 100%)',
      backgroundAttachment: 'fixed',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

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

        {/* Logo + heading */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>
            Muse<span style={{ color: '#c084fc' }}>Type</span>
          </div>
          <h1 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.5rem', marginBottom: 6 }}>
            Create your account
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Free forever · No credit card required
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
            {/* Username */}
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: 7, letterSpacing: '0.08em' }}>
                USERNAME
              </label>
              <input
                type="text"
                required
                className="auth-input"
                placeholder="e.g. beethoven99"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Email */}
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
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: 7, letterSpacing: '0.08em' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 48 }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(strength / 3) * 100}%`, background: strengthColors[strength], borderRadius: 2, transition: 'all 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strengthColors[strength], fontWeight: 600, width: 48 }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: 7, letterSpacing: '0.08em' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    paddingRight: 48,
                    borderColor: confirmPassword && password !== confirmPassword
                      ? 'rgba(248,113,113,0.5)' : undefined,
                  }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 4 }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#f87171', fontSize: '0.73rem', marginTop: 6 }}>Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p style={{ color: '#34d399', fontSize: '0.73rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} /> Passwords match
                </p>
              )}
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
                  Creating account…
                </span>
              ) : '🎵 Create Account'}
            </button>
          </form>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '24px 0' }} />

          <p style={{ color: '#4b5563', fontSize: '0.83rem', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#eab308', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Log in here →
            </Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SignupPage;
