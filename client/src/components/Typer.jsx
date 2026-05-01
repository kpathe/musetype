import React, { useState, useEffect, useRef } from 'react';
import AudioEngine from '../utils/AudioEngine';
import Caret from './Caret';
import Results from './Results';
import useTypingStore from '../store/useTypingStore';
import useAuthStore from '../store/useAuthStore';

const Typer = ({ text = "", lessonId, lessonTitle }) => {
  const [inputState, setInputState] = useState({
    typed: "",
    errors: [],
  });
  
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0 });
  const [startTime, setStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  
  // Tracking for chart
  const [statsLog, setStatsLog] = useState([]);
  const [finalStats, setFinalStats] = useState(null);
  
  const charRefs = useRef([]);
  const containerRef = useRef(null);
  const { submitSession } = useTypingStore();
  const { isAuthenticated } = useAuthStore();
  
  // Interval for chart data
  useEffect(() => {
    if (!startTime || isFinished) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const timeElapsed = (now - startTime) / 60000; // minutes
      if (timeElapsed === 0) return;
      
      setInputState(curr => {
        const grossWPM = (curr.typed.length / 5) / timeElapsed;
        const netWPM = Math.max(0, Math.round(grossWPM - (curr.errors.length / timeElapsed)));
        
        setStatsLog(prev => [...prev, {
          second: Math.round(timeElapsed * 60),
          wpm: netWPM,
          raw: Math.round(grossWPM),
          errors: curr.errors.length > (prev[prev.length-1]?.totalErrors || 0) ? 1 : 0,
          totalErrors: curr.errors.length
        }]);
        
        return curr;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, isFinished]);

  // Update caret position when typed length changes
  useEffect(() => {
    const activeIndex = inputState.typed.length;
    if (charRefs.current[activeIndex] && containerRef.current) {
      const charRect = charRefs.current[activeIndex].getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setCaretPos({
        left: charRect.left - containerRect.left,
        top: charRect.top - containerRect.top
      });
    }
  }, [inputState.typed, text, isFinished]);

  useEffect(() => {
    if (isFinished) return;

    const handleKeyDown = (e) => {
      if (e.key === ' ') e.preventDefault();
      if (e.key.length !== 1 && e.key !== 'Backspace') return; 

      if (!startTime && e.key !== 'Backspace') {
        setStartTime(Date.now());
      }
      
      setInputState(prev => {
        const expectedChar = text[prev.typed.length];
        
        if (e.key === 'Backspace') {
          return { ...prev, typed: prev.typed.slice(0, -1) };
        }
        
        if (e.key === expectedChar) {
          AudioEngine.playNoteForKey(e.key);
          const newTyped = prev.typed + e.key;
          
          if (newTyped.length === text.length) {
            handleComplete(prev.errors.length, newTyped.length);
          }
          return { ...prev, typed: newTyped };
        } else {
          if (prev.typed.length < text.length) {
            AudioEngine.playError();
            const errors = prev.errors.includes(prev.typed.length) 
              ? prev.errors 
              : [...prev.errors, prev.typed.length];
            return { ...prev, errors };
          }
          return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, isFinished, startTime]);

  const handleComplete = async (errorCount, totalLength) => {
    setIsFinished(true);
    const endTime = Date.now();
    const timeInSeconds = Math.round((endTime - startTime) / 1000);
    const timeInMinutes = timeInSeconds / 60;
    
    const grossWPM = Math.round((totalLength / 5) / timeInMinutes);
    const netWPM = Math.max(0, Math.round(grossWPM - (errorCount / timeInMinutes)));
    const accuracy = Math.max(0, Math.round(((totalLength - errorCount) / totalLength) * 100));

    // Calculate consistency (e.g., standard deviation of WPM, mocked here roughly)
    const consistency = Math.max(0, 100 - Math.round(errorCount * 2)); 

    setFinalStats({
      wpm: netWPM,
      accuracy,
      rawWpm: grossWPM,
      correctChars: totalLength - errorCount,
      incorrectChars: errorCount,
      consistency,
      time: timeInSeconds,
      isAuthenticated,
      lessonTitle
    });

    if (lessonId && isAuthenticated) {
      await submitSession({ lessonId, wpm: netWPM, accuracy });
    }
  };

  const handleRestart = () => {
    setInputState({ typed: "", errors: [] });
    setStartTime(null);
    setIsFinished(false);
    setStatsLog([]);
    setFinalStats(null);
  };

  if (isFinished && finalStats) {
    return (
      <Results 
        stats={finalStats} 
        chartData={statsLog} 
        onRestart={handleRestart}
        onNext={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={containerRef}
        className="relative text-3xl font-mono text-gray-500 max-w-5xl mx-auto leading-relaxed focus:outline-none select-none transition-opacity duration-500"
      >
        {!isFinished && <Caret left={caretPos.left} top={caretPos.top} />}
        {text.split('').map((char, index) => {
          let colorClass = "text-gray-500";
          if (index < inputState.typed.length) {
            colorClass = "text-gray-100";
          }
          if (inputState.errors.includes(index)) {
            colorClass = "text-red-500 border-b-2 border-red-500";
          }
          return (
            <span 
              key={index} 
              ref={el => charRefs.current[index] = el}
              className={`transition-colors duration-200 ${colorClass}`}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default Typer;
