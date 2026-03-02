import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTeam } from './contexts/TeamContext';
import { ArrowLeft } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

// Components
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import GlobalSearch from './components/GlobalSearch';

// Pages
import DashboardPage from './pages/DashboardPage';
import TeamsPage from './pages/TeamsPage';
import TodoPage from './pages/TodoPage';
import ResourcesPage from './pages/ResourcesPage';
import SnippetsPage from './pages/SnippetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { db } from './firebase';

/**
 * App Router Component
 * Handles Authentication state and Route definitions
 */
function App() {
  const { currentUser } = useAuth();
  const { currentTeam } = useTeam();
  const [showLogin, setShowLogin] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [todos, setTodos] = useState([]);
  const [snippets, setSnippets] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setHackathons([]);
      setTodos([]);
      setSnippets([]);
      setActivityLogs([]);
      return;
    }

    const hackathonsQuery = currentTeam
      ? query(collection(db, 'hackathons'), where('teamId', '==', currentTeam.id))
      : query(collection(db, 'hackathons'), where('ownerId', '==', currentUser.uid));

    const todosQuery = currentTeam
      ? query(collection(db, 'todos'), where('teamId', '==', currentTeam.id))
      : query(collection(db, 'todos'), where('ownerId', '==', currentUser.uid));

    const snippetsQuery = currentTeam
      ? query(collection(db, 'snippets'), where('teamId', '==', currentTeam.id), orderBy('createdAt', 'desc'))
      : query(collection(db, 'snippets'), where('ownerId', '==', currentUser.uid), orderBy('createdAt', 'desc'));

    const ownerSnippetsQuery = query(
      collection(db, 'snippets'),
      where('ownerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const activityQuery = currentTeam
      ? query(collection(db, 'activityLogs'), where('teamId', '==', currentTeam.id), orderBy('createdAt', 'desc'), limit(40))
      : query(collection(db, 'activityLogs'), where('ownerId', '==', currentUser.uid), orderBy('createdAt', 'desc'), limit(40));

    let snippetsFallbackUnsubscribe = null;

    const unsubscribers = [
      onSnapshot(
        hackathonsQuery,
        (snapshot) => {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => (currentTeam ? item.teamId === currentTeam.id : !item.teamId));
          setHackathons(items);
        },
        (error) => {
          console.error('Hackathons listener failed:', error);
          setHackathons([]);
        }
      ),
      onSnapshot(
        todosQuery,
        (snapshot) => {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => (currentTeam ? item.teamId === currentTeam.id : !item.teamId));
          setTodos(items);
        },
        (error) => {
          console.error('Todos listener failed:', error);
          setTodos([]);
        }
      ),
      onSnapshot(
        snippetsQuery,
        (snapshot) => {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => (currentTeam ? item.teamId === currentTeam.id : !item.teamId));
          setSnippets(items);
        },
        (error) => {
          console.error('Snippets listener failed:', error);
          if (currentTeam && error?.code === 'permission-denied') {
            console.warn('Falling back to owner snippets in team mode due permission-denied.');
            if (!snippetsFallbackUnsubscribe) {
              snippetsFallbackUnsubscribe = onSnapshot(
                ownerSnippetsQuery,
                (ownerSnapshot) => {
                  const ownerItems = ownerSnapshot.docs
                    .map((entry) => ({ id: entry.id, ...entry.data() }))
                    .filter((item) => !item.teamId || item.ownerId === currentUser.uid);
                  setSnippets(ownerItems);
                },
                (fallbackError) => {
                  console.error('Owner snippets fallback listener failed:', fallbackError);
                  setSnippets([]);
                }
              );
            }
          } else {
            setSnippets([]);
          }
        }
      ),
      onSnapshot(
        activityQuery,
        (snapshot) => {
          const items = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }))
            .filter((item) => (currentTeam ? item.teamId === currentTeam.id : !item.teamId));
          setActivityLogs(items);
        },
        (error) => {
          console.error('Activity logs listener failed:', error);
          setActivityLogs([]);
        }
      )
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      if (snippetsFallbackUnsubscribe) snippetsFallbackUnsubscribe();
    };
  }, [currentUser, currentTeam]);

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
    <>
      <GlobalSearch
        hackathons={hackathons}
        todos={todos}
        snippets={snippets}
        activityLogs={activityLogs}
      />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/todo" element={<TodoPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/snippets" element={<SnippetsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
