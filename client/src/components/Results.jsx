import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { RotateCcw, ChevronRight, Activity, Crosshair, Clock, Keyboard } from 'lucide-react';
import KeyboardHeatmap from './KeyboardHeatmap';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, unit, icon: Icon, color }) => (
  <div className="glass-panel p-6 flex items-center justify-between">
    <div>
      <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className="text-5xl font-light text-white">
        {value}<span className={`text-lg ${color}`}>{unit}</span>
      </div>
    </div>
    <Icon size={48} className={`${color} opacity-30`} />
  </div>
);

const Results = ({ stats, chartData, keyStats = {}, onRestart, onNext }) => {
  const hasKeyData = Object.keys(keyStats).length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in mt-8 z-10 relative">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wide drop-shadow-lg mb-2">
          Performance Complete
        </h2>
        <p className="text-purple-300 font-medium tracking-widest uppercase text-sm">
          {stats.lessonTitle || 'Freestyle Session'}
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard label="Speed" value={stats.wpm} unit=" WPM" icon={Activity} color="text-purple-400" />
        <StatCard label="Accuracy" value={stats.accuracy} unit="%" icon={Crosshair} color="text-emerald-400" />
        <StatCard label="Time" value={stats.time} unit="s" icon={Clock} color="text-blue-400" />
      </div>

      {/* Secondary stats row */}
      <div className="glass-panel p-5 mb-6 flex flex-wrap gap-8 justify-center">
        {[
          { label: 'Raw WPM', value: stats.rawWpm, color: '#94a3b8' },
          { label: 'Consistency', value: `${stats.consistency}%`, color: '#94a3b8' },
          { label: 'Correct Chars', value: stats.correctChars, color: '#34d399' },
          { label: 'Errors', value: stats.incorrectChars, color: stats.incorrectChars > 0 ? '#f87171' : '#34d399' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl font-light" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* WPM Chart */}
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold tracking-wide">Rhythm Analysis</h3>
          <div className="flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> WPM
            </span>
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="second" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'seconds', position: 'insideBottom', fill: '#475569', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Area yAxisId="left" type="monotone" dataKey="wpm" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" activeDot={{ r: 6, fill: '#fff', stroke: '#c084fc', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Keyboard Heatmap */}
      {hasKeyData && (
        <div className="glass-panel p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Keyboard size={20} className="text-purple-400" />
            <h3 className="text-white font-semibold tracking-wide">Key Performance</h3>
            <span className="text-gray-500 text-xs ml-2">
              Hover keys for details · Colors show speed + accuracy combined
            </span>
          </div>
          <KeyboardHeatmap keyStats={keyStats} />

          {/* Worst keys callout */}
          <WorstKeysCallout keyStats={keyStats} />
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
        <button onClick={onRestart} className="glass-button flex items-center gap-2">
          <RotateCcw size={16} /> Retake Lesson
        </button>
        <button onClick={onNext} className="glass-button flex items-center gap-2 bg-purple-600/30 border-purple-500/50 hover:bg-purple-600/50 text-white">
          <ChevronRight size={16} /> Next Session
        </button>
      </div>

      {!stats.isAuthenticated && (
        <div className="text-center mt-4 glass-panel p-5 max-w-md mx-auto">
          <p className="text-gray-300 font-medium mb-3">Save your progress & track improvement over time</p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
            style={{ cursor: 'pointer' }}
          >
            Sign Up — It's Free
          </Link>
        </div>
      )}
    </div>
  );
};

// Show the 3 worst-performing keys with a quick tip
const WorstKeysCallout = ({ keyStats }) => {
  const entries = Object.entries(keyStats)
    .filter(([, s]) => s.count > 0)
    .map(([key, s]) => {
      const avgMs = s.totalMs / s.count;
      const errRate = s.errors / (s.count + s.errors);
      return { key, avgMs, errRate, count: s.count };
    })
    .sort((a, b) => (b.errRate * 0.6 + (b.avgMs / 500) * 0.4) - (a.errRate * 0.6 + (a.avgMs / 500) * 0.4))
    .slice(0, 3);

  if (entries.length === 0 || entries[0].errRate === 0) return null;

  return (
    <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 14 }}>
      <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.8rem', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Keys to Practice
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {entries.map(({ key, avgMs, errRate }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,0.1)', padding: '6px 12px', borderRadius: 8 }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: '#f87171', textTransform: 'uppercase' }}>{key}</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {Math.round(errRate * 100)}% errors · {Math.round(avgMs)}ms avg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;
