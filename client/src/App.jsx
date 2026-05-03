import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import TypingView from './pages/TypingView';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthStore();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  const { fetchMe, loading } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading MuseType...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Make the typing view the default landing page */}
        <Route path="/" element={<TypingView />} />
        
        <Route path="/login" element={<Landing />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* For specific lessons from dashboard */}
        <Route path="/type/:lessonId" element={<TypingView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
