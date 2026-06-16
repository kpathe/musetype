import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioEngine from '../utils/AudioEngine';
import Caret from './Caret';
import Results from './Results';
import useTypingStore from '../store/useTypingStore';
import useAuthStore from '../store/useAuthStore';

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px' }}>
      {data.map((v, i) => (
        <div
          key={i}
          className={`sparkline-bar ${i === data.length - 1 ? 'active' : ''}`}
          style={{ height: `${Math.max(4, (v / max) * 28)}px` }}
        />
      ))}
    </div>
  );
};

// ─── Live WPM HUD ─────────────────────────────────────────────────────────────
const LiveHud = ({ wpm, bpm, wpmHistory }) => (
  <div className="live-wpm-hud">
    <div style={{ textAlign: 'right' }}>
      <div className="live-wpm-number">{wpm}</div>
      <div className="live-wpm-label">WPM Live</div>
    </div>
    <Sparkline data={wpmHistory} />
    {bpm > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        <div
          className="bpm-pulse"
          style={{ '--bpm-interval': `${Math.max(0.2, 60 / bpm)}s` }}
        />
        <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.1em' }}>
          {bpm} BPM
        </span>
      </div>
    )}
  </div>
);

// ─── Main Typer ───────────────────────────────────────────────────────────────
const Typer = ({ text = '', lessonId, lessonTitle }) => {
  const [inputState, setInputState] = useState({ typed: '', errors: [] });
  const [caretPos, setCaretPos]     = useState({ left: 0, top: 0 });
  const [startTime, setStartTime]   = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  // Live stats
  const [liveWpm, setLiveWpm]       = useState(0);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [liveBpm, setLiveBpm]       = useState(0);

  // Chart data & per-key heatmap
  const [statsLog, setStatsLog]     = useState([]);
  const [keyStats, setKeyStats]     = useState({});
  const lastKeyTimeRef              = useRef(null);
  const keystrokesRef               = useRef([]);

  const charRefs     = useRef([]);
  const containerRef = useRef(null);
  const { submitSession } = useTypingStore();
  const { isAuthenticated } = useAuthStore();

  // ── Live stats interval ──────────────────────────────────────────
  useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTime) / 60000;
      if (elapsed === 0) return;

      setInputState(curr => {
        const grossWPM = (curr.typed.length / 5) / elapsed;
        const netWPM   = Math.max(0, Math.round(grossWPM - curr.errors.length / elapsed));
        setLiveWpm(netWPM);
        setWpmHistory(prev => [...prev.slice(-14), netWPM]);
        setStatsLog(prev => [...prev, {
          second: Math.round(elapsed * 60),
          wpm: netWPM,
          raw: Math.round(grossWPM),
          errors: curr.errors.length > (prev[prev.length - 1]?.totalErrors || 0) ? 1 : 0,
          totalErrors: curr.errors.length,
        }]);
        return curr;
      });

      // BPM from keystroke density (last 5 seconds)
      const fiveSec = now - 5000;
      keystrokesRef.current = keystrokesRef.current.filter(t => t > fiveSec);
      setLiveBpm(Math.round((keystrokesRef.current.length / 5) * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // ── Caret positioning ────────────────────────────────────────────
  useEffect(() => {
    const idx = inputState.typed.length;
    if (charRefs.current[idx] && containerRef.current) {
      const cr = charRefs.current[idx].getBoundingClientRect();
      const pr = containerRef.current.getBoundingClientRect();
      setCaretPos({ left: cr.left - pr.left, top: cr.top - pr.top });
    }
  }, [inputState.typed, text]);

  // ── Key handler ──────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === ' ') e.preventDefault();
    if (e.key.length !== 1 && e.key !== 'Backspace') return;

    const now = Date.now();
    if (!startTime && e.key !== 'Backspace') {
      setStartTime(now);
      lastKeyTimeRef.current = now;
    }
    if (e.key !== 'Backspace') keystrokesRef.current.push(now);

    setInputState(prev => {
      if (e.key === 'Backspace') {
        lastKeyTimeRef.current = now;
        return { ...prev, typed: prev.typed.slice(0, -1) };
      }

      const expectedChar   = text[prev.typed.length];
      const timeSinceLast  = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : null;
      lastKeyTimeRef.current = now;

      if (e.key === expectedChar) {
        // ── Correct keypress ─────────────────────────────────────
        AudioEngine.playNoteForKey(e.key);

        if (timeSinceLast !== null) {
          setKeyStats(ks => {
            const k  = e.key.toLowerCase();
            const ex = ks[k] || { count: 0, totalMs: 0, errors: 0 };
            return { ...ks, [k]: { ...ex, count: ex.count + 1, totalMs: ex.totalMs + timeSinceLast } };
          });
        }

        const newTyped = prev.typed + e.key;
        if (newTyped.length === text.length) handleComplete(prev.errors.length, newTyped.length);
        return { ...prev, typed: newTyped };
      } else {
        // ── Wrong keypress ───────────────────────────────────────
        if (prev.typed.length < text.length) {
          AudioEngine.playError();
          setKeyStats(ks => {
            const k  = e.key.toLowerCase();
            const ex = ks[k] || { count: 0, totalMs: 0, errors: 0 };
            return { ...ks, [k]: { ...ex, errors: ex.errors + 1 } };
          });
          const errors = prev.errors.includes(prev.typed.length)
            ? prev.errors
            : [...prev.errors, prev.typed.length];
          return { ...prev, errors };
        }
        return prev;
      }
    });
  }, [text, isFinished, startTime]);

  useEffect(() => {
    if (isFinished) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, isFinished]);

  // ── Complete ─────────────────────────────────────────────────────
  const handleComplete = async (errorCount, totalLength) => {
    setIsFinished(true);
    const endTime    = Date.now();
    const timeInSec  = Math.round((endTime - startTime) / 1000);
    const timeInMin  = timeInSec / 60;
    const grossWPM   = Math.round((totalLength / 5) / timeInMin);
    const netWPM     = Math.max(0, Math.round(grossWPM - errorCount / timeInMin));
    const accuracy   = Math.max(0, Math.round(((totalLength - errorCount) / totalLength) * 100));
    const consistency = Math.max(0, 100 - Math.round(errorCount * 2));

    const stats = {
      wpm: netWPM, accuracy, rawWpm: grossWPM,
      correctChars: totalLength - errorCount,
      incorrectChars: errorCount, consistency,
      time: timeInSec, isAuthenticated, lessonTitle,
    };

    setKeyStats(ks => { /* freeze */ return ks; });

    setTimeout(() => {
      setIsFinished(true);
      window._finalTyperStats = { stats, statsLog, keyStats };
    }, 0);

    if (lessonId && isAuthenticated) {
      await submitSession({ lessonId, wpm: netWPM, accuracy });
    }

    // Trigger Results via a separate finalStats state
    setFinalStats({ ...stats, _log: statsLog });
  };

  const [finalStats, setFinalStats] = useState(null);

  const handleRestart = () => {
    setInputState({ typed: '', errors: [] });
    setStartTime(null);
    setIsFinished(false);
    setStatsLog([]);
    setFinalStats(null);
    setLiveWpm(0);
    setWpmHistory([]);
    setLiveBpm(0);
    setKeyStats({});
    keystrokesRef.current = [];
    lastKeyTimeRef.current = null;
  };

  // ── Finished ─────────────────────────────────────────────────────
  if (isFinished && finalStats) {
    return (
      <Results
        stats={finalStats}
        chartData={finalStats._log || statsLog}
        keyStats={keyStats}
        onRestart={handleRestart}
        onNext={() => window.location.reload()}
      />
    );
  }

  const progress = text.length > 0 ? (inputState.typed.length / text.length) * 100 : 0;

  return (
    <div className="w-full flex flex-col items-center gap-6">

      {/* ── Progress bar ────────────────────────────────────────── */}
      <div style={{
        width: '100%', maxWidth: '860px', height: '3px',
        background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
          borderRadius: '2px', transition: 'width 0.2s ease',
          boxShadow: progress > 0 ? '0 0 8px rgba(192,132,252,0.5)' : 'none',
        }} />
      </div>

      {/* ── Typing text ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative text-3xl font-mono text-gray-500 max-w-5xl mx-auto leading-relaxed focus:outline-none select-none"
      >
        {!isFinished && <Caret left={caretPos.left} top={caretPos.top} />}
        {text.split('').map((char, index) => {
          let color = '#4b5563';
          if (index < inputState.typed.length) color = '#e2e8f0';
          if (inputState.errors.includes(index)) color = '#f87171';
          return (
            <span
              key={index}
              ref={el => charRefs.current[index] = el}
              className="transition-colors duration-150"
              style={{
                color,
                textDecoration: inputState.errors.includes(index)
                  ? 'underline wavy rgba(248,113,113,0.6)' : 'none',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* ── Live HUD ────────────────────────────────────────────── */}
      {startTime && !isFinished && (
        <LiveHud wpm={liveWpm} bpm={liveBpm} wpmHistory={wpmHistory} />
      )}
    </div>
  );
};

export default Typer;
