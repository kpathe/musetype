import React, { useMemo } from 'react';

// Full QWERTY keyboard layout rows
const ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','y','u','i','o','p','[',']','\\'],
  ['a','s','d','f','g','h','j','k','l',';',"'"],
  ['z','x','c','v','b','n','m',',','.','/'],
];

// Fraction-width for special keys per row
const ROW_EXTRA = [
  { key: 'backspace', label: '⌫', flex: 1.5, row: 0 },
  { key: 'tab', label: 'Tab', flex: 1.3, row: 1 },
  { key: 'caps', label: 'Caps', flex: 1.5, row: 2 },
  { key: 'enter', label: '↵', flex: 1.7, row: 2 },
  { key: 'lshift', label: '⇧', flex: 2.0, row: 3 },
  { key: 'rshift', label: '⇧', flex: 2.0, row: 3 },
];

// Color scale from green (fast/accurate) → yellow → red (slow/error-prone)
// Returns a CSS color string based on a 0–1 score (1 = best)
function scoreToColor(score) {
  if (score === null) return 'rgba(255,255,255,0.06)'; // un-typed key
  // score 1.0 = emerald, 0.5 = yellow, 0.0 = red
  if (score >= 0.75) {
    // green-ish
    const t = (score - 0.75) / 0.25; // 0→1 as score goes 0.75→1.0
    const g = Math.round(140 + t * 70);
    return `rgba(30, ${g}, 100, 0.85)`;
  } else if (score >= 0.45) {
    // yellow-ish
    const t = (score - 0.45) / 0.30;
    return `rgba(${Math.round(200 + t * 34)}, ${Math.round(140 + t * 50)}, 20, 0.85)`;
  } else {
    // red-ish
    const t = score / 0.45;
    return `rgba(${Math.round(180 + t * 20)}, ${Math.round(40 + t * 60)}, 30, 0.85)`;
  }
}

function scoreToTextColor(score) {
  if (score === null) return '#4b5563';
  if (score >= 0.7) return '#d1fae5';
  if (score >= 0.4) return '#fef9c3';
  return '#fecaca';
}

/**
 * keyStats: { [char]: { count: number, totalMs: number, errors: number } }
 * Renders an interactive keyboard heatmap based on per-key performance.
 */
const KeyboardHeatmap = ({ keyStats = {} }) => {
  // Compute per-key score: normalized 0–1, balancing speed + accuracy
  const keyScores = useMemo(() => {
    const allKeys = Object.keys(keyStats);
    if (allKeys.length === 0) return {};

    // Average ms per key for reference
    const avgMs = allKeys.reduce((acc, k) => {
      const s = keyStats[k];
      return s.count > 0 ? acc + s.totalMs / s.count : acc;
    }, 0) / Math.max(allKeys.length, 1);

    const scores = {};
    allKeys.forEach(k => {
      const s = keyStats[k];
      if (s.count === 0) return;
      const avgKeyMs = s.totalMs / s.count;
      // Speed score: how fast vs average (capped)
      const speedScore = Math.min(1, avgMs / Math.max(avgKeyMs, 50));
      // Accuracy score: 1 = no errors, 0 = always errored
      const accScore = Math.max(0, 1 - s.errors / (s.count + s.errors));
      scores[k] = speedScore * 0.45 + accScore * 0.55; // weighted combo
    });
    return scores;
  }, [keyStats]);

  return (
    <div className="keyboard-heatmap">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {ROWS.map((row, rowIdx) => {
          const extraLeft = ROW_EXTRA.find(e => e.row === rowIdx && e.key.startsWith('l') || (e.row === rowIdx && (e.key === 'tab' || e.key === 'caps')));
          const extraRight = ROW_EXTRA.find(e => e.row === rowIdx && (e.key === 'backspace' || e.key === 'enter' || e.key === 'rshift'));
          const extraLeftForRow = ROW_EXTRA.filter(e => e.row === rowIdx && (e.key === 'tab' || e.key === 'caps' || e.key === 'lshift'));
          const extraRightForRow = ROW_EXTRA.filter(e => e.row === rowIdx && (e.key === 'backspace' || e.key === 'enter' || e.key === 'rshift'));

          return (
            <div key={rowIdx} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              {/* Left special keys */}
              {extraLeftForRow.map(spec => (
                <div
                  key={spec.key}
                  className="key-cap"
                  style={{
                    flexShrink: 0,
                    width: `${spec.flex * 38}px`,
                    height: '38px',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#374151',
                    fontSize: '0.6rem',
                  }}
                >
                  {spec.label}
                </div>
              ))}

              {/* Regular keys */}
              {row.map(key => {
                const score = keyScores.hasOwnProperty(key) ? keyScores[key] : null;
                const stats = keyStats[key];
                const bgColor = scoreToColor(score);
                const textColor = scoreToTextColor(score);
                const avgMs = stats && stats.count > 0 ? Math.round(stats.totalMs / stats.count) : null;

                return (
                  <div
                    key={key}
                    className="key-cap"
                    style={{
                      width: '38px',
                      height: '38px',
                      flexShrink: 0,
                      background: bgColor,
                      color: textColor,
                      border: score !== null
                        ? `1px solid ${textColor}33`
                        : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {key.toUpperCase()}
                    {stats && stats.count > 0 && (
                      <div className="key-tooltip">
                        <div style={{ color: textColor, fontWeight: 700, marginBottom: 4 }}>
                          {key.toUpperCase()}
                        </div>
                        <div style={{ color: '#94a3b8' }}>
                          Typed: <span style={{ color: '#e2e8f0' }}>{stats.count}×</span>
                        </div>
                        {avgMs && (
                          <div style={{ color: '#94a3b8' }}>
                            Avg speed: <span style={{ color: '#e2e8f0' }}>{avgMs}ms</span>
                          </div>
                        )}
                        <div style={{ color: '#94a3b8' }}>
                          Errors: <span style={{ color: stats.errors > 0 ? '#f87171' : '#34d399' }}>
                            {stats.errors}
                          </span>
                        </div>
                        {score !== null && (
                          <div style={{ marginTop: 4 }}>
                            Score:{' '}
                            <span style={{ color: textColor, fontWeight: 700 }}>
                              {Math.round(score * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Right special keys */}
              {extraRightForRow.map(spec => (
                <div
                  key={spec.key}
                  className="key-cap"
                  style={{
                    flexShrink: 0,
                    width: `${spec.flex * 38}px`,
                    height: '38px',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#374151',
                    fontSize: '0.6rem',
                  }}
                >
                  {spec.label}
                </div>
              ))}
            </div>
          );
        })}

        {/* Space bar row */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: 2 }}>
          {['ctrl','alt'].map(k => (
            <div key={k} className="key-cap" style={{ width: '52px', height: '32px', flexShrink: 0, background: 'rgba(255,255,255,0.04)', color: '#374151', fontSize: '0.55rem' }}>
              {k.toUpperCase()}
            </div>
          ))}
          <div className="key-cap" style={{ flex: 1, height: '32px', background: 'rgba(255,255,255,0.04)', color: '#374151', fontSize: '0.6rem', letterSpacing: '0.15em' }}>
            SPACE
          </div>
          {['alt','ctrl'].map(k => (
            <div key={`r-${k}`} className="key-cap" style={{ width: '52px', height: '32px', flexShrink: 0, background: 'rgba(255,255,255,0.04)', color: '#374151', fontSize: '0.55rem' }}>
              {k.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 }}>
        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Slow / Error-prone</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95].map(s => (
            <div key={s} style={{
              width: 20, height: 14, borderRadius: 4,
              background: scoreToColor(s),
            }} />
          ))}
        </div>
        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Fast / Accurate</span>
      </div>
    </div>
  );
};

export default KeyboardHeatmap;
