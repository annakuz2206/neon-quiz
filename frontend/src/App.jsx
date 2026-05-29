import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GameRoom from './pages/GameRoom';
import AdminHistory from './pages/AdminHistory';
import CreateQuizPage from './pages/CreateQuizPage';
import QuizManagementPage from './pages/QuizManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import UserHistoryPage from './pages/UserHistoryPage';
import EditQuizPage from './pages/EditQuizPage';
import ActiveQuizzesPage from './pages/ActiveQuizzesPage';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('neon_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Auth setUser={setUser} />}
        />

        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/game"
          element={user ? <GameRoom user={user} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/active-quizzes"
          element={user ? <ActiveQuizzesPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/my-history"
          element={user ? <UserHistoryPage user={user} /> : <Navigate to="/" replace />}
        />
        <Route path="/admin-history" element={
          user && (user.role === 'admin' || user.role === 'superadmin')
            ? <AdminHistory />
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="/create-quiz" element={
          user && (user.role === 'admin' || user.role === 'superadmin')
            ? <CreateQuizPage />
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="/manage-quizzes" element={
          user && (user.role === 'admin' || user.role === 'superadmin')
            ? <QuizManagementPage />
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="/edit-quiz/:id" element={
          user && (user.role === 'admin' || user.role === 'superadmin')
            ? <EditQuizPage />
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="/manage-users" element={
          user && user.role === 'superadmin'
            ? <UserManagementPage />
            : <Navigate to="/dashboard" replace />
        } />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;