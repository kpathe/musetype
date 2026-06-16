import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AudioEngine from '../utils/AudioEngine';
import { Music, Zap, BarChart2, Keyboard, ArrowRight, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';

// ─── Floating Music Note Particles ───────────────────────────────────────────
const NOTES_CHARS = ['♩', '♪', '♫', '♬', '𝄞', '𝄢'];

const Particle = ({ style, note }) => (
  <div
    className="hero-particle"
    style={{
      ...style,
      fontSize: `${style.size}px`,
      color: style.color,
      animationDuration: `${style.duration}s`,
      animationDelay: `${style.delay}s`,
      left: `${style.left}%`,
      bottom: '-20px',
      width: 'auto',
      height: 'auto',
      background: 'none',
      borderRadius: 0,
    }}
  >
    {note}
  </div>
);

const ParticleBg = () => {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 12 + Math.random() * 18,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * 8,
    color: ['rgba(192,132,252,0.25)', 'rgba(234,179,8,0.2)', 'rgba(52,211,153,0.15)'][i % 3],
    note: NOTES_CHARS[i % NOTES_CHARS.length],
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <Particle key={p.id} style={p} note={p.note} />
      ))}
    </div>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="feature-card" style={{ flex: '1 1 220px' }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`, marginBottom: 16,
    }}>
      <Icon size={22} style={{ color }} />
    </div>
    <h3 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>{title}</h3>
    <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</p>
  </div>
);

// ─── Guest Typer (Demo) ───────────────────────────────────────────────────────
const DEMO_TEXT = 'music flows from your fingertips as you type each note with perfect rhythm and grace';

const GuestTyper = ({ onComplete }) => {
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState([]);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [liveWpm, setLiveWpm] = useState(0);
  const caretRef = useRef(null);
  const charRefs = useRef([]);
  const containerRef = useRef(null);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });
  const intervalRef = useRef(null);

  // WPM interval
  useEffect(() => {
    if (!startTime) return;
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 60000;
      if (elapsed > 0) {
        setLiveWpm(Math.round((typed.length / 5) / elapsed));
      }
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [startTime, typed]);

  // Caret position
  useEffect(() => {
    const idx = typed.length;
    if (charRefs.current[idx] && containerRef.current) {
      const cr = charRefs.current[idx].getBoundingClientRect();
      const pr = containerRef.current.getBoundingClientRect();
      setCaretPos({ left: cr.left - pr.left, top: cr.top - pr.top });
    }
  }, [typed]);

  const handleKey = useCallback((e) => {
    if (e.key === ' ') e.preventDefault();
    if (e.key.length !== 1 && e.key !== 'Backspace') return;

    if (!startTime && e.key !== 'Backspace') setStartTime(Date.now());
    if (!started && e.key !== 'Backspace') setStarted(true);

    if (e.key === 'Backspace') {
      setTyped(t => t.slice(0, -1));
      return;
    }

    const expected = DEMO_TEXT[typed.length];
    if (e.key === expected) {
      AudioEngine.playNoteForKey(e.key);
      const newTyped = typed + e.key;
      setTyped(newTyped);
      if (newTyped.length === DEMO_TEXT.length) {
        clearInterval(intervalRef.current);
        setTimeout(() => onComplete(), 600);
      }
    } else {
      AudioEngine.playError();
      setErrors(prev => prev.includes(typed.length) ? prev : [...prev, typed.length]);
    }
  }, [typed, startTime, started, onComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const progress = (typed.length / DEMO_TEXT.length) * 100;

  return (
    <div style={{ position: 'relative' }}>
      {/* Progress */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #c084fc)', transition: 'width 0.2s ease', borderRadius: 2 }} />
      </div>

      {/* Text */}
      <div
        ref={containerRef}
        className="guest-typer-text"
        style={{ position: 'relative', cursor: 'text' }}
      >
        {/* Caret */}
        <span
          ref={caretRef}
          className="caret"
          style={{ position: 'absolute', left: caretPos.left, top: caretPos.top + 4 }}
        />
        {DEMO_TEXT.split('').map((char, i) => {
          let color = '#4b5563';
          if (i < typed.length) color = '#e2e8f0';
          if (errors.includes(i)) color = '#f87171';
          return (
            <span
              key={i}
              ref={el => charRefs.current[i] = el}
              style={{ color, transition: 'color 0.1s ease' }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Hint */}
      {!started && (
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.8rem', marginTop: 20 }}>
          ↑ Click here & start typing to demo MuseType
        </p>
      )}

      {/* Live WPM badge */}
      {started && liveWpm > 0 && (
        <div style={{
          position: 'absolute', top: -48, right: 0,
          background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.25)',
          borderRadius: 12, padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Zap size={12} style={{ color: '#c084fc' }} />
          <span style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.85rem' }}>{liveWpm} WPM</span>
        </div>
      )}
    </div>
  );
};

// ─── Auth Form ────────────────────────────────────────────────────────────────
const AuthForm = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
  };

  const validate = () => {
    if (!email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Please enter your password.';
    if (mode === 'register') {
      if (!username.trim()) return 'Please choose a username.';
      if (username.length < 3) return 'Username must be at least 3 characters.';
      if (password.length < 6) return 'Password must be at least 6 characters.';
      if (confirmPassword && password !== confirmPassword) return 'Passwords do not match.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMsg('Welcome back! Redirecting…');
        setTimeout(() => navigate('/type'), 800);
      } else {
        await register(username, email, password);
        setSuccessMsg('Account created! Redirecting to your workspace…');
        setTimeout(() => navigate('/type'), 800);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError(mode === 'login'
          ? 'Incorrect email or password. Please try again.'
          : (serverMsg || 'Registration failed. This email may already be in use.')
        );
      } else if (err.response?.status === 409) {
        setError('An account with this email or username already exists. Try logging in instead.');
      } else if (err.response?.status === 422) {
        setError(serverMsg || 'Invalid data. Please check your inputs.');
      } else {
        setError(serverMsg || 'Something went wrong. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 24, padding: 36, width: '100%', maxWidth: 420,
    }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: 4, marginBottom: 28 }}>
        <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>
          Log In
        </button>
        <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>
          Sign Up
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 20,
        }}>
          <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
          <span style={{ color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 20,
        }}>
          <Check size={16} style={{ color: '#34d399' }} />
          <span style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mode === 'register' && (
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
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
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
            EMAIL
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

        <div>
          <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
            PASSWORD
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              required
              className="auth-input"
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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

        {mode === 'register' && (
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              className="auth-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        )}

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading}
          style={{ marginTop: 4 }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              {mode === 'login' ? 'Signing in…' : 'Creating account…'}
            </span>
          ) : (
            mode === 'login' ? '🎹 Start Playing' : '🎵 Create Account'
          )}
        </button>
      </form>

      <p style={{ color: '#4b5563', fontSize: '0.8rem', textAlign: 'center', marginTop: 20 }}>
        {mode === 'login' ? (
          <>Don't have an account?{' '}
            <button onClick={() => switchMode('register')} style={{ color: '#eab308', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
              Sign up free
            </button>
          </>
        ) : (
          <>Already have an account?{' '}
            <button onClick={() => switchMode('login')} style={{ color: '#eab308', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
              Log in
            </button>
          </>
        )}
      </p>
    </div>
  );
};

// ─── Demo CTA (after guest completes the demo text) ──────────────────────────
const DemoCTA = ({ onRetry }) => (
  <div style={{
    textAlign: 'center', padding: '32px 24px',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.08))',
    border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20,
    animation: 'fadeIn 0.5s ease-out',
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
    <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.4rem', marginBottom: 8 }}>
      Impressive! You've got rhythm.
    </h3>
    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
      Sign up to access all lessons, track your WPM over time, see your key heatmaps, and unlock advanced music modes.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link
        to="/#auth"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #eab308, #f59e0b)',
          color: '#1a1200', fontWeight: 800, fontSize: '0.95rem',
          padding: '12px 28px', borderRadius: 14, textDecoration: 'none',
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(234,179,8,0.25)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        Create Free Account <ArrowRight size={16} />
      </Link>
      <button
        onClick={onRetry}
        style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', fontWeight: 600, fontSize: '0.9rem',
          padding: '12px 24px', borderRadius: 14, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e2e8f0'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
      >
        Try Again
      </button>
    </div>
  </div>
);

// ─── Landing Page ─────────────────────────────────────────────────────────────
const Landing = () => {
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [demoKey, setDemoKey] = useState(0); // remount GuestTyper on retry
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Animated Particle Background ─────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <ParticleBg />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Nav ──────────────────────────────────────────────── */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(15,12,41,0.6)', backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
              Muse<span style={{ color: '#c084fc' }}>Type</span>
            </span>
          </Link>
          <Link
            to="/type"
            className="glass-button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#e2e8f0' }}
          >
            Try App <ArrowRight size={14} />
          </Link>
        </nav>

        {/* ── Hero Section ─────────────────────────────────────── */}
        <section style={{ textAlign: 'center', padding: '80px 24px 60px', maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 50, padding: '6px 16px', marginBottom: 28,
            color: '#c084fc', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em',
          }}>
            <Music size={13} /> TYPING MEETS MUSIC
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24,
            background: 'linear-gradient(135deg, #fff 0%, #c084fc 50%, #eab308 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Type faster.<br />Sound better.
          </h1>

          <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            MuseType turns every keystroke into a musical note. Practice typing while playing real melodies — and track exactly which keys hold you back.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/type"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                padding: '14px 32px', borderRadius: 16, textDecoration: 'none',
                cursor: 'pointer', boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)'; }}
            >
              <Music size={18} /> Open App
            </Link>
            <a
              href="#demo"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#e2e8f0', fontWeight: 600, fontSize: '1rem',
                padding: '14px 28px', borderRadius: 16, textDecoration: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              Try Demo ↓
            </a>
          </div>
        </section>

        {/* ── Feature Cards ─────────────────────────────────────── */}
        <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <FeatureCard
              icon={Music}
              title="Real-time Music"
              desc="Every correct keystroke plays a synthesized piano, synth pad, or marimba note in real time."
              color="#c084fc"
            />
            <FeatureCard
              icon={Zap}
              title="Live WPM & BPM"
              desc="Watch your speed update every second with a live WPM counter and musical BPM meter."
              color="#f59e0b"
            />
            <FeatureCard
              icon={Keyboard}
              title="Key Heatmap"
              desc="After each session, see a keybr-style heatmap showing your slowest and most error-prone keys."
              color="#34d399"
            />
            <FeatureCard
              icon={BarChart2}
              title="Progress History"
              desc="All sessions are saved to your profile. Track WPM and accuracy trends across all lessons."
              color="#60a5fa"
            />
          </div>
        </section>

        {/* ── Guest Demo Section ────────────────────────────────── */}
        <section id="demo" style={{
          maxWidth: 820, margin: '0 auto 80px', padding: '0 24px',
          scrollMarginTop: 80,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '2rem', marginBottom: 10 }}>
              Try it now — no account needed
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Type the sentence below and hear the music. Sign up after to unlock everything.
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '48px 40px', position: 'relative',
          }}>
            {!demoCompleted ? (
              <GuestTyper
                key={demoKey}
                onComplete={() => setDemoCompleted(true)}
              />
            ) : (
              <DemoCTA onRetry={() => { setDemoCompleted(false); setDemoKey(k => k + 1); }} />
            )}
          </div>
        </section>

        {/* ── Auth Section ──────────────────────────────────────── */}
        <section id="auth" style={{
          display: 'flex', justifyContent: 'center',
          padding: '0 24px 80px',
          scrollMarginTop: 80,
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>
                Join MuseType
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Free forever · No credit card · Save all your stats
              </p>
            </div>
            <AuthForm />
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '24px', textAlign: 'center', color: '#374151', fontSize: '0.8rem',
        }}>
          MuseType · Play the music as you type · {new Date().getFullYear()}
        </footer>
      </div>

      {/* Spin animation for loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
