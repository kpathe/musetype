import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useTypingStore from '../store/useTypingStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, Play } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { lessons, sessions, fetchLessons, fetchSessions, setActiveLesson } = useTypingStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
    fetchSessions();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startLesson = (lessonId) => {
    setActiveLesson(lessonId);
    navigate(`/type/${lessonId}`);
  };

  // Prepare chart data
  const chartData = [...sessions].reverse().map((s, i) => ({
    name: `Session ${i + 1}`,
    wpm: s.wpm,
    accuracy: s.accuracy
  }));

  const avgWPM = sessions.length ? Math.round(sessions.reduce((acc, s) => acc + s.wpm, 0) / sessions.length) : 0;
  const avgAcc = sessions.length ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length) : 0;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-12 glass-panel p-6 px-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, <span className="text-purple-400">{user?.username}</span></h1>
          <p className="text-gray-300 mt-1">Ready to make some music?</p>
        </div>
        <button onClick={handleLogout} className="glass-button flex items-center gap-2">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass-panel p-8 text-center">
          <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3">Sessions Played</h3>
          <p className="text-5xl font-light text-white">{sessions.length}</p>
        </div>
        <div className="glass-panel p-8 text-center">
          <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3">Average WPM</h3>
          <p className="text-5xl font-light text-purple-400">{avgWPM}</p>
        </div>
        <div className="glass-panel p-8 text-center">
          <h3 className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-3">Average Accuracy</h3>
          <p className="text-5xl font-light text-emerald-400">{avgAcc}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-bold text-white mb-6 tracking-wide">Performance History</h2>
          <div className="glass-panel p-6 h-80">
            {sessions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No data yet. Play a lesson!</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#c084fc" tick={{fill: '#c084fc'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#34d399" tick={{fill: '#34d399'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Line yAxisId="left" type="monotone" dataKey="wpm" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: '#c084fc' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#34d399" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-6 tracking-wide">Available Lessons</h2>
          <div className="space-y-4">
            {lessons.map(lesson => (
              <div key={lesson._id} className="glass-panel p-5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{lesson.title}</h3>
                  <p className="text-gray-400 text-sm">{lesson.text.split(' ').length} words • {lesson.difficulty}</p>
                </div>
                <button 
                  onClick={() => startLesson(lesson._id)}
                  className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all shadow-lg"
                >
                  <Play fill="currentColor" size={20} className="ml-1" />
                </button>
              </div>
            ))}
            {lessons.length === 0 && <p className="text-gray-400">Loading lessons...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
