import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

// Components
import Login from './components/Login';
import LandingPage from './components/LandingPage';

// Pages
import DashboardPage from './pages/DashboardPage';
import TeamsPage from './pages/TeamsPage';

/**
 * App Router Component
 * Handles Authentication state and Route definitions
 */
function App() {
  const { currentUser } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  // Authentication Flow
  if (!currentUser) {
    if (showLogin) {
      return (
        <div className="relative">
          <button
            onClick={() => setShowLogin(false)}
            className="absolute top-6 left-6 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Login />
        </div>
      );
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  // Authenticated App Routes
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
