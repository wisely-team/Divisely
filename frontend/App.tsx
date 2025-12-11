import React from 'react';
import { HashRouter, MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const AppContent = () => {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!currentUser ? <SignUpPage /> : <Navigate to="/dashboard" />} />
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
