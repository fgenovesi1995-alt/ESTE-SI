
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Screens
import LandingPage from './screens/LandingPage';
import Login from './screens/Login';
import UserHome from './screens/UserHome';
import ChatDetail from './screens/ChatDetail';
import ProProfile from './screens/ProProfile';
import ProfileSettings from './screens/ProfileSettings';
import CreateTask from './screens/CreateTask';
import MapView from './screens/MapView';
import Inbox from './screens/Inbox';
import AISupport from './screens/AISupport';
import TasksHistory from './screens/TasksHistory';
import ProfessionalList from './screens/ProfessionalList';
import Privacy from './screens/Privacy';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useApp();
  if (!state.isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!state.currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useApp();
  if (!state.isInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background-dark">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (state.currentUser) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full relative shadow-2xl bg-white dark:bg-background-dark overflow-hidden flex flex-col">
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

        <Route path="/home" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><ChatDetail /></ProtectedRoute>} />
        <Route path="/pro/:id" element={<ProtectedRoute><ProProfile /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
        <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksHistory /></ProtectedRoute>} />
        <Route path="/category/:categoryId" element={<ProtectedRoute><ProfessionalList /></ProtectedRoute>} />
        <Route path="/premium-pros" element={<ProtectedRoute><ProfessionalList isPremiumOnly={true} /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/ai-support" element={<ProtectedRoute><AISupport /></ProtectedRoute>} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
