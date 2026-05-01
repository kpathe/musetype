import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { RotateCcw, ChevronRight, Activity, Crosshair, Clock } from 'lucide-react';

const Results = ({ stats, chartData, onRestart, onNext }) => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in mt-8 z-10 relative">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wide drop-shadow-lg mb-2">Performance Complete</h2>
        <p className="text-purple-300 font-medium tracking-widest uppercase text-sm">
          {stats.lessonTitle || 'Freestyle Session'}
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Speed</div>
            <div className="text-5xl font-light text-white">{stats.wpm} <span className="text-lg text-purple-400">WPM</span></div>
          </div>
          <Activity size={48} className="text-purple-500/30" />
        </div>

        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Accuracy</div>
            <div className="text-5xl font-light text-white">{stats.accuracy}<span className="text-lg text-emerald-400">%</span></div>
          </div>
          <Crosshair size={48} className="text-emerald-500/30" />
        </div>

        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Time</div>
            <div className="text-5xl font-light text-white">{stats.time}<span className="text-lg text-blue-400">s</span></div>
          </div>
          <Clock size={48} className="text-blue-500/30" />
        </div>

      </div>

      {/* Main Chart Area */}
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold tracking-wide">Rhythm Analysis</h3>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Raw: <span className="text-white">{stats.rawWpm}</span></span>
            <span>Consistency: <span className="text-white">{stats.consistency}%</span></span>
            <span>Errors: <span className="text-red-400">{stats.incorrectChars}</span></span>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="second" 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                yAxisId="left" 
                stroke="#64748b" 
                tick={{fill: '#64748b', fontSize: 12}} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="wpm" 
                stroke="#c084fc" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorWpm)" 
                activeDot={{ r: 6, fill: '#fff', stroke: '#c084fc', strokeWidth: 2 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-center items-center gap-6">
        <button onClick={onRestart} className="glass-button flex items-center gap-2">
          <RotateCcw size={16} /> Retake Lesson
        </button>
        <button onClick={onNext} className="glass-button flex items-center gap-2 bg-purple-600/30 border-purple-500/50 hover:bg-purple-600/50 text-white">
          <ChevronRight size={16} /> Next Session
        </button>
      </div>
      
      {!stats.isAuthenticated && (
        <div className="text-center text-gray-400 mt-6 text-sm">
          Sign in to save your performance history
        </div>
      )}
    </div>
  );
};

export default Results;
