import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import TranslationPage from './pages/TranslationPage';
import GlossaryPage from './pages/GlossaryPage';
import AdminPanel from './pages/AdminPanel';
import CreateSession from './pages/CreateSession';
import JoinSession from './pages/JoinSession';
import PhysicalMeetingPage from './pages/PhysicalMeetingPage';
import ArchivePage from './pages/ArchivePage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/translate"
            element={
              <PrivateRoute>
                <TranslationPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/glossary"
            element={
              <PrivateRoute>
                <GlossaryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-session"
            element={
              <PrivateRoute>
                <CreateSession />
              </PrivateRoute>
            }
          />
          <Route
            path="/join-session"
            element={
              <PrivateRoute>
                <JoinSession />
              </PrivateRoute>
            }
          />
          <Route
            path="/meeting/:sessionCode"
            element={
              <PrivateRoute>
                <PhysicalMeetingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/archive"
            element={
              <PrivateRoute>
                <ArchivePage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
