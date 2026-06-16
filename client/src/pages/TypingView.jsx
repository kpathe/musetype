import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useTypingStore from '../store/useTypingStore';
import useAuthStore from '../store/useAuthStore';
import Typer from '../components/Typer';
import AudioEngine, { INSTRUMENTS } from '../utils/AudioEngine';
import {
  LayoutDashboard, User, ChevronDown, Check, Edit3,
  Music, Volume2, Settings, Play
} from 'lucide-react';

// ─── Difficulty Badge ─────────────────────────────────────────────────────────
const DifficultyBadge = ({ level }) => {
  const map = {
    beginner:     { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   label: 'Beginner' },
    intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Intermediate' },
    advanced:     { color: '#f87171', bg: 'rgba(248,113,113,0.1)', label: 'Advanced' },
  };
  const s = map[level?.toLowerCase()] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: level || 'Custom' };
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
      padding: '2px 8px', borderRadius: 50,
      color: s.color, background: s.bg, textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  );
};

// ─── Lesson Picker Dropdown ───────────────────────────────────────────────────
const LessonPicker = ({ lessons, activeLesson, isCustomMode, onLessonSelect, onCustomMode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTitle = isCustomMode ? 'Custom Text' : (activeLesson?.title || 'Select Lesson');

  return (
    <>
      {/* Full-screen backdrop — dims content when picker is open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(5,3,20,0.72)',
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <div ref={ref} style={{ position: 'relative', display: 'inline-block', zIndex: 50 }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: open ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${open ? 'rgba(168,85,247,0.45)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14, padding: '8px 16px', cursor: 'pointer',
            color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600,
            transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            position: 'relative', zIndex: 50,
          }}
        >
          <Music size={15} style={{ color: '#c084fc' }} />
          <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTitle}</span>
          <ChevronDown
            size={15}
            style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
        </button>

        {open && (
          <div className="lesson-picker-dropdown" style={{ zIndex: 51 }}>
            {lessons.map(lesson => {
              const isActive = !isCustomMode && activeLesson?._id === lesson._id;
              const wordCount = lesson.text.split(' ').length;
              return (
                <div
                  key={lesson._id}
                  className={`lesson-picker-item ${isActive ? 'active' : ''}`}
                  onClick={() => { onLessonSelect(lesson._id); setOpen(false); }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>{lesson.title}</span>
                      {isActive && <Check size={13} style={{ color: '#c084fc', flexShrink: 0 }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DifficultyBadge level={lesson.difficulty} />
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{wordCount} words</span>
                    </div>
                    <p style={{
                      color: '#475569', fontSize: '0.7rem', marginTop: 6,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240,
                    }}>
                      {lesson.text.substring(0, 65)}…
                    </p>
                  </div>
                </div>
              );
            })}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />

            <div
              className={`lesson-picker-item ${isCustomMode ? 'active' : ''}`}
              onClick={() => { onCustomMode(); setOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <Edit3 size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.875rem' }}>Custom Text</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Paste your own content</div>
                </div>
                {isCustomMode && <Check size={13} style={{ color: '#f59e0b' }} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Instrument Selector ──────────────────────────────────────────────────────
const InstrumentSelector = ({ active, onChange }) => {
  const instruments = [
    { id: INSTRUMENTS.PIANO,   label: '🎹 Piano' },
    { id: INSTRUMENTS.SYNTH,   label: '🎛️ Synth' },
    { id: INSTRUMENTS.MARIMBA, label: '🪘 Marimba' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {instruments.map(ins => (
        <button
          key={ins.id}
          className={`instrument-pill ${active === ins.id ? 'active' : ''}`}
          onClick={() => onChange(ins.id)}
        >
          {ins.label}
        </button>
      ))}
    </div>
  );
};

// ─── Volume Control ───────────────────────────────────────────────────────────
const VolumeControl = ({ volume, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Volume2 size={14} style={{ color: '#64748b' }} />
    <input
      type="range" min={0} max={1} step={0.05}
      value={volume}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="volume-slider"
    />
    <span style={{ color: '#64748b', fontSize: '0.75rem', width: 32 }}>
      {Math.round(volume * 100)}%
    </span>
  </div>
);

// ─── Main TypingView ──────────────────────────────────────────────────────────
const TypingView = () => {
  const { lessonId } = useParams();
  const navigate     = useNavigate();
  const { lessons, fetchLessons, activeLesson, setActiveLesson } = useTypingStore();
  const { isAuthenticated } = useAuthStore();

  const [customText, setCustomText]       = useState('');
  const [isCustomMode, setIsCustomMode]   = useState(false);
  const [isCustomReady, setIsCustomReady] = useState(false);

  const [instrument, setInstrument]       = useState(INSTRUMENTS.PIANO);
  const [volume, setVolume]               = useState(0.75);
  const [showSettings, setShowSettings]   = useState(false);

  const settingsRef    = useRef(null);
  const textareaRef    = useRef(null);
  // Ref that mirrors isCustomMode but is updated SYNCHRONOUSLY before any
  // navigate() or setState() call — prevents the useEffect race condition
  // where lessonId is still the old value when isCustomMode state hasn't landed yet.
  const customModeRef  = useRef(false);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  useEffect(() => {
    if (lessons.length > 0) {
      // If user explicitly chose custom mode, never override it from URL params
      if (customModeRef.current) return;

      if (lessonId) {
        setActiveLesson(lessonId);
        setIsCustomMode(false);
        setIsCustomReady(false);
      } else {
        setActiveLesson(lessons[0]._id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons, lessonId]);

  // Close settings panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLessonSelect = (id) => {
    customModeRef.current = false;   // leave custom mode
    setIsCustomMode(false);
    setIsCustomReady(false);
    navigate(`/type/${id}`);
  };

  const handleCustomMode = () => {
    customModeRef.current = true;    // set ref FIRST — before navigate/setState
    navigate('/type');
    setIsCustomMode(true);
    setIsCustomReady(false);
    setActiveLesson(null);
    setCustomText('');
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const handleStartCustomLesson = () => {
    if (!customText.trim()) return;
    setIsCustomReady(true);
  };

  const handleCancelCustom = () => {
    customModeRef.current = false;   // leave custom mode
    setIsCustomMode(false);
    setIsCustomReady(false);
    setCustomText('');
    if (lessons.length > 0) navigate(`/type/${lessons[0]._id}`);
  };

  const handleInstrumentChange = (ins) => {
    setInstrument(ins);
    AudioEngine.setInstrument(ins);
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    AudioEngine.setVolume(vol);
  };

  const textToType = isCustomMode
    ? customText.trim()
    : (activeLesson?.text || 'loading...');

  const showTyper = isCustomMode ? isCustomReady : !!activeLesson;

  return (
    <div className="min-h-screen flex flex-col p-8 max-w-6xl mx-auto relative z-10">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        className="mb-10 flex flex-wrap justify-between items-center glass-panel p-4 px-6 gap-4"
        style={{ position: 'relative', zIndex: 50 }}
      >
        {/* Left: Logo + Lesson Picker */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/" className="text-2xl font-bold text-white tracking-tighter drop-shadow-md flex-shrink-0">
            Muse<span className="text-purple-300">Type</span>
          </Link>
          <div className="h-6 w-px bg-white/15" />
          <LessonPicker
            lessons={lessons}
            activeLesson={activeLesson}
            isCustomMode={isCustomMode}
            onLessonSelect={handleLessonSelect}
            onCustomMode={handleCustomMode}
          />
        </div>

        {/* Right: Audio Settings + Nav */}
        <div className="flex items-center gap-4 flex-wrap">
          <div ref={settingsRef} style={{ position: 'relative' }}>
            <button
              className="glass-button flex items-center gap-2"
              onClick={() => setShowSettings(v => !v)}
              style={{ padding: '6px 14px' }}
            >
              <Settings size={15} />
              <span className="text-xs">Audio</span>
            </button>
            {showSettings && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                background: 'rgba(12,10,36,0.97)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18,
                padding: 20, minWidth: 300, zIndex: 100,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                animation: 'dropdown-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Instrument
                </div>
                <InstrumentSelector active={instrument} onChange={handleInstrumentChange} />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Volume
                </div>
                <VolumeControl volume={volume} onChange={handleVolumeChange} />
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <Link to="/dashboard" className="glass-button flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : (
            <Link to="/" className="glass-button flex items-center gap-2">
              <User size={16} /> Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ── Custom Text Editor ────────────────────────────────────── */}
      {isCustomMode && !isCustomReady && (
        <div className="mb-8 w-full max-w-2xl mx-auto">
          <div className="glass-panel p-7">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} style={{ color: '#f59e0b' }} />
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem' }}>Custom Text Input</span>
              </div>
              <button
                onClick={handleCancelCustom}
                title="Close custom editor"
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                  color: '#64748b', fontSize: '0.75rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                ✕ Cancel
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-purple-400 focus:bg-white/10 resize-none transition-all placeholder-gray-500"
              rows={5}
              placeholder="Paste or type the text you want to practice…"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ color: '#475569', fontSize: '0.78rem' }}>
                {customText.trim().split(/\s+/).filter(Boolean).length} words · {customText.trim().length} chars
              </span>
              <button
                onClick={handleStartCustomLesson}
                disabled={!customText.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: customText.trim()
                    ? 'linear-gradient(135deg, #7c3aed, #c084fc)'
                    : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: 12,
                  padding: '10px 22px',
                  cursor: customText.trim() ? 'pointer' : 'not-allowed',
                  color: customText.trim() ? '#fff' : '#475569',
                  fontWeight: 700, fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  boxShadow: customText.trim() ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
                }}
                onMouseEnter={e => { if (customText.trim()) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                <Play size={15} fill="currentColor" />
                Start Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Typing Area ──────────────────────────────────────── */}
      <main className="flex-grow flex flex-col justify-center items-center">
        {showTyper && (
          <Typer
            key={isCustomMode ? `custom-${textToType.slice(0, 20)}` : activeLesson?._id}
            text={textToType}
            lessonId={isCustomMode ? null : activeLesson?._id}
            lessonTitle={isCustomMode ? 'Custom Text' : activeLesson?.title}
          />
        )}
        {!showTyper && !isCustomMode && (
          <div className="text-gray-500 text-lg">Loading lessons…</div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="text-center text-gray-500 text-xs mt-8 pb-2">
        {!isAuthenticated
          ? <span>Playing as guest — <Link to="/" className="text-yellow-500 hover:underline cursor-pointer">Sign in</Link> to save your stats</span>
          : <span>Keyboard mapped to 4th octave · Type to play · {instrument} mode</span>
        }
      </footer>
    </div>
  );
};

export default TypingView;
