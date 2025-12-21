import React from 'react';
import { HashRouter, MemoryRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/ui/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { GroupDetailsPage } from './pages/GroupDetailsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { JoinGroupPage } from './pages/JoinGroupPage';
import Settings from './pages/Settings';
import RecentActivity from './pages/RecentActivity';

// Redirect component for /groups/:id -> /group/:id
const GroupsRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/group/${id}`} replace />;
};

const AppContent = () => {
  const { currentUser } = useApp();

  // Helper to get redirect path for logged in users
  // Note: We don't remove redirectAfterLogin here because LoginPage handles that
  // after successful navigation. This prevents race conditions.
  const getRedirectPath = () => {
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin) {
      return redirectAfterLogin;
    }
    return '/dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to={getRedirectPath()} />} />
      <Route path="/signup" element={!currentUser ? <SignUpPage /> : <Navigate to={getRedirectPath()} />} />
      <Route path="/forgot-password" element={!currentUser ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
      <Route path="/join/:groupId" element={<JoinGroupPage />} />
      <Route
        path="/dashboard"
        element={
          currentUser ? (
            <Layout>
              <DashboardPage />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/group/:id"
        element={
          currentUser ? (
            <Layout>
              <GroupDetailsPage />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      {/* Redirect /groups/:id to /group/:id for backward compatibility */}
      <Route path="/groups/:id" element={<GroupsRedirect />} />
      <Route
        path="/profile"
        element={
          currentUser ? (
            <Layout>
              <UserProfilePage />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/settings"
        element={
          currentUser ? (
            <Layout>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/activity"
        element={
          currentUser ? (
            <Layout>
              <RecentActivity />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/" element={<Navigate to={currentUser ? '/dashboard' : '/login'} />} />
    </Routes>
  );
};

const App = () => {
  const isBlob = window.location.protocol === 'blob:';
  const Router = isBlob ? MemoryRouter : HashRouter;

  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
};

export default App;
