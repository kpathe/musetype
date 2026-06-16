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
  if (!isAuthenticated) return <Navigate to="/" />;
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
        {/* Landing / home page */}
        <Route path="/" element={<Landing />} />

        {/* Typing app — open to everyone */}
        <Route path="/type" element={<TypingView />} />
        <Route path="/type/:lessonId" element={<TypingView />} />

        {/* Dashboard — logged-in only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
