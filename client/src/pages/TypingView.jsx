import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useTypingStore from '../store/useTypingStore';
import useAuthStore from '../store/useAuthStore';
import Typer from '../components/Typer';
import AudioEngine from '../utils/AudioEngine';
import { Settings, User, LayoutDashboard, Edit3 } from 'lucide-react';

const TypingView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { lessons, fetchLessons, activeLesson, setActiveLesson } = useTypingStore();
  const { isAuthenticated } = useAuthStore();
  
  const [customText, setCustomText] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [selectedTrackSeq, setSelectedTrackSeq] = useState([]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  useEffect(() => {
    if (lessons.length > 0) {
      if (lessonId) {
        setActiveLesson(lessonId);
        setIsCustomMode(false);
      } else if (!isCustomMode) {
        setActiveLesson(lessons[0]._id);
      }
    }
  }, [lessons, lessonId, setActiveLesson, isCustomMode]);

  const handleLessonChange = (e) => {
    const id = e.target.value;
    if (id === 'custom') {
      setIsCustomMode(true);
      setActiveLesson(null);
      // Default to first track's sequence for custom typing
      setSelectedTrackSeq(lessons[0]?.trackSequence || []);
    } else {
      setIsCustomMode(false);
      navigate(`/type/${id}`);
    }
  };

  const handleCustomTrackChange = (e) => {
    const trackSequenceStr = e.target.value;
    setSelectedTrackSeq(JSON.parse(trackSequenceStr));
  };

  const textToType = isCustomMode 
    ? (customText.trim() || "type your custom text here...") 
    : (activeLesson?.text || "loading...");

  return (
    <div className="min-h-screen flex flex-col p-8 max-w-6xl mx-auto relative z-10">
      
      {/* Top Header Navigation */}
      <header className="mb-12 flex justify-between items-center glass-panel p-4 px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-3xl font-bold text-white tracking-tighter drop-shadow-md">
            Muse<span className="text-purple-300">Type</span>
          </Link>
          <div className="h-6 w-px bg-white/20 mx-2"></div>
          
          <select 
            className="bg-transparent border-none text-gray-200 outline-none focus:ring-0 cursor-pointer appearance-none font-medium"
            onChange={handleLessonChange}
            value={isCustomMode ? 'custom' : (activeLesson?._id || '')}
          >
            {lessons.map(l => (
              <option key={l._id} value={l._id} className="bg-slate-900">{l.title}</option>
            ))}
            <option value="custom" className="bg-slate-900">-- Custom Text --</option>
          </select>
        </div>

        <nav className="flex gap-6 text-gray-300">
          {isAuthenticated ? (
            <Link to="/dashboard" className="glass-button flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : (
            <Link to="/login" className="glass-button flex items-center gap-2">
              <User size={16} /> Login
            </Link>
          )}
        </nav>
      </header>

      {/* Main Typing Interface */}
      <main className="flex-grow flex flex-col justify-center items-center relative">
        
        {isCustomMode && (
          <div className="absolute top-0 w-full max-w-2xl text-center glass-panel p-6 z-20">
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-4 font-medium">
              <Edit3 size={18} /> <span>Custom Text Input</span>
            </div>
            <textarea 
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-purple-400 focus:bg-white/10 resize-none transition-all placeholder-gray-400"
              rows={4}
              placeholder="Paste the text you want to type here..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
          </div>
        )}

        <div className={`w-full transition-all duration-700 ${isCustomMode ? 'mt-64' : 'mt-0'}`}>
          {/* Key trick: changing key forces Typer to remount when switching lessons/modes */}
          {(activeLesson || isCustomMode) && (
            <Typer 
              key={isCustomMode ? 'custom' : activeLesson?._id} 
              text={textToType} 
              lessonId={isCustomMode ? null : activeLesson?._id}
              lessonTitle={isCustomMode ? 'Custom Text' : activeLesson?.title}
            />
          )}
        </div>

      </main>
      
      <footer className="text-center text-gray-400 text-sm mt-8 glass-panel p-3 max-w-md mx-auto">
        {!isAuthenticated ? <p>Log in to save your stats and view the dashboard.</p> : <p>Keyboard mapped to 4th octave. Type to play.</p>}
      </footer>
    </div>
  );
};

export default TypingView;
