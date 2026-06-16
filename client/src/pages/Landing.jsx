import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AudioEngine from '../utils/AudioEngine';
import { Music, Zap, BarChart2, Keyboard, ArrowRight, LogIn, UserPlus } from 'lucide-react';

// ─── Floating Music Note Particles ───────────────────────────────────────────
const NOTES_CHARS = ['♩', '♪', '♫', '♬', '𝄞', '𝄢'];

const ParticleBg = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: 12 + Math.random() * 20,
    duration: 9 + Math.random() * 14,
    delay: Math.random() * 10,
    color: ['rgba(192,132,252,0.22)', 'rgba(234,179,8,0.18)', 'rgba(52,211,153,0.14)'][i % 3],
    note: NOTES_CHARS[i % NOTES_CHARS.length],
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="hero-particle"
          style={{
            fontSize: `${p.size}px`,
            color: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            left: `${p.left}%`,
            bottom: '-20px',
            width: 'auto',
            height: 'auto',
            background: 'none',
            borderRadius: 0,
          }}
        >
          {p.note}
        </div>
      ))}
    </div>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="feature-card" style={{ flex: '1 1 200px' }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}18`, marginBottom: 16,
    }}>
      <Icon size={22} style={{ color }} />
    </div>
    <h3 style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>{title}</h3>
    <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.6 }}>{desc}</p>
  </div>
);

// ─── Guest Demo Typer ─────────────────────────────────────────────────────────
const DEMO_TEXT = 'music flows from your fingertips as you type each note with perfect rhythm and grace';

const GuestTyper = ({ onComplete }) => {
  const [typed, setTyped] = useState('');
  const [errors, setErrors] = useState([]);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [liveWpm, setLiveWpm] = useState(0);
  const charRefs = useRef([]);
  const containerRef = useRef(null);
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 60000;
      if (elapsed > 0) setLiveWpm(Math.round((typed.length / 5) / elapsed));
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [startTime, typed]);

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
    if (!startTime && e.key !== 'Backspace') { setStartTime(Date.now()); setStarted(true); }

    if (e.key === 'Backspace') { setTyped(t => t.slice(0, -1)); return; }

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
  }, [typed, startTime, onComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const progress = (typed.length / DEMO_TEXT.length) * 100;

  return (
    <div style={{ position: 'relative' }}>
      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
          transition: 'width 0.2s ease', borderRadius: 2,
          boxShadow: progress > 0 ? '0 0 6px rgba(192,132,252,0.4)' : 'none',
        }} />
      </div>

      {/* Live WPM badge */}
      {started && liveWpm > 0 && (
        <div style={{
          position: 'absolute', top: 8, right: 0,
          background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.25)',
          borderRadius: 12, padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Zap size={12} style={{ color: '#c084fc' }} />
          <span style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.85rem' }}>{liveWpm} WPM</span>
        </div>
      )}

      {/* Typing text */}
      <div
        ref={containerRef}
        className="guest-typer-text"
        style={{ position: 'relative', cursor: 'text' }}
      >
        {/* Caret */}
        <span
          className="caret"
          style={{ position: 'absolute', left: caretPos.left, top: caretPos.top + 4 }}
        />
        {DEMO_TEXT.split('').map((char, i) => {
          let color = '#4b5563';
          if (i < typed.length) color = '#e2e8f0';
          if (errors.includes(i)) color = '#f87171';
          return (
            <span key={i} ref={el => charRefs.current[i] = el} style={{ color, transition: 'color 0.1s ease' }}>
              {char}
            </span>
          );
        })}
      </div>

      {!started && (
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.82rem', marginTop: 22, letterSpacing: '0.02em' }}>
          ↑ Click anywhere &amp; start typing to hear the music
        </p>
      )}
    </div>
  );
};

// ─── Post-Demo CTA ─────────────────────────────────────────────────────────────
const DemoCTA = ({ onRetry }) => (
  <div style={{
    textAlign: 'center', padding: '36px 28px',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.07))',
    border: '1px solid rgba(168,85,247,0.2)', borderRadius: 20,
    animation: 'fadeIn 0.5s ease-out',
  }}>
    <div style={{ fontSize: '2.8rem', marginBottom: 14 }}>🎉</div>
    <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.4rem', marginBottom: 10 }}>
      You've got rhythm!
    </h3>
    <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px' }}>
      Sign up free to access all lessons, save your WPM history, unlock key heatmaps, and choose your instrument.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link
        to="/signup"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #eab308, #f59e0b)',
          color: '#1a1200', fontWeight: 800, fontSize: '0.95rem',
          padding: '12px 28px', borderRadius: 14, textDecoration: 'none',
          cursor: 'pointer', boxShadow: '0 8px 24px rgba(234,179,8,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(234,179,8,0.35)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(234,179,8,0.25)'; }}
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
  const [demoKey, setDemoKey] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/type');
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Particle background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <ParticleBg />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Sticky Nav ───────────────────────────────────────────── */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 48px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(15,12,41,0.7)', backdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            Muse<span style={{ color: '#c084fc' }}>Type</span>
          </span>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                color: '#94a3b8', fontWeight: 600, fontSize: '0.88rem',
                padding: '8px 18px', borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                textDecoration: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              <LogIn size={14} /> Log In
            </Link>
            <Link
              to="/signup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                padding: '8px 20px', borderRadius: 50,
                textDecoration: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.3)'; }}
            >
              <UserPlus size={14} /> Sign Up
            </Link>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section style={{ textAlign: 'center', padding: '90px 24px 60px', maxWidth: 740, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 50, padding: '6px 18px', marginBottom: 30,
            color: '#c084fc', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em',
          }}>
            <Music size={13} /> TYPING MEETS MUSIC
          </div>

          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 26,
            background: 'linear-gradient(135deg, #fff 0%, #c084fc 50%, #eab308 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Type faster.<br />Sound better.
          </h1>

          <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: 44, maxWidth: 520, margin: '0 auto 44px' }}>
            MuseType turns every keystroke into a musical note. Practice typing while playing real melodies — and track exactly which keys hold you back.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: 'linear-gradient(135deg, #7c3aed, #c084fc)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                padding: '14px 32px', borderRadius: 16, textDecoration: 'none',
                cursor: 'pointer', boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(124,58,237,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)'; }}
            >
              <UserPlus size={18} /> Get Started Free
            </Link>
            <Link
              to="/type"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#e2e8f0', fontWeight: 600, fontSize: '1rem',
                padding: '14px 28px', borderRadius: 16, textDecoration: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <Music size={18} /> Open App
            </Link>
          </div>
        </section>

        {/* ── Feature Cards ─────────────────────────────────────────── */}
        <section style={{ maxWidth: 980, margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <FeatureCard icon={Music}     title="Real-time Music"   desc="Every correct keystroke plays a synthesized piano, synth pad, or marimba note instantly."       color="#c084fc" />
            <FeatureCard icon={Zap}       title="Live WPM & BPM"    desc="Watch your speed update every second with a live counter and a musical BPM rhythm meter."       color="#f59e0b" />
            <FeatureCard icon={Keyboard}  title="Key Heatmap"        desc="See a keybr-style heatmap after each session showing your slowest and most error-prone keys."   color="#34d399" />
            <FeatureCard icon={BarChart2} title="Progress History"   desc="All sessions saved to your profile. Track WPM and accuracy trends across every lesson."         color="#60a5fa" />
          </div>
        </section>

        {/* ── Demo Section ──────────────────────────────────────────── */}
        <section id="demo" style={{ maxWidth: 840, margin: '0 auto 90px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '2rem', marginBottom: 10 }}>
              Try it now — no account needed
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
              Type the sentence below and hear the music in real time.
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '48px 44px', position: 'relative',
          }}>
            {!demoCompleted ? (
              <GuestTyper key={demoKey} onComplete={() => setDemoCompleted(true)} />
            ) : (
              <DemoCTA onRetry={() => { setDemoCompleted(false); setDemoKey(k => k + 1); }} />
            )}
          </div>
        </section>

        {/* ── Bottom CTA strip ─────────────────────────────────────── */}
        <section style={{
          textAlign: 'center', padding: '60px 24px 80px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <h2 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: '1.8rem', marginBottom: 12 }}>
            Ready to play for real?
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 32 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#c084fc', fontWeight: 600, textDecoration: 'none' }}>
              Log in here →
            </Link>
          </p>
          <Link
            to="/signup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: 'linear-gradient(135deg, #eab308, #f59e0b)',
              color: '#1a1200', fontWeight: 800, fontSize: '1rem',
              padding: '14px 36px', borderRadius: 16, textDecoration: 'none',
              cursor: 'pointer', boxShadow: '0 8px 28px rgba(234,179,8,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(234,179,8,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(234,179,8,0.3)'; }}
          >
            🎵 Create Free Account
          </Link>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '24px', textAlign: 'center', color: '#374151', fontSize: '0.78rem',
        }}>
          MuseType · Play the music as you type · {new Date().getFullYear()}
        </footer>

      </div>
    </div>
  );
};

export default Landing;
