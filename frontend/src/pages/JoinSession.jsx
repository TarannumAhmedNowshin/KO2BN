import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/client';
import './SessionPages.css';

const JoinSession = () => {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoinSession = async (e) => {
    e.preventDefault();
    
    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    if (sessionCode.length !== 6 || !/^\d+$/.test(sessionCode)) {
      setError('Session code must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify session exists and is active
      await axios.get(`/api/sessions/${sessionCode}`);
      
      // Join session
      await axios.post(`/api/sessions/${sessionCode}/join`, {
        user_name: userName || null
      });

      // Navigate to meeting page
      navigate(`/meeting/${sessionCode}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join session. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSessionCode(value);
  };

  return (
    <div className="session-page">
      <div className="session-card">
        <h1>Join Meeting Session</h1>
        <p className="subtitle">Enter the 6-digit session code to join</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleJoinSession}>
          <div className="form-group">
            <label htmlFor="sessionCode">Session Code</label>
            <input
              id="sessionCode"
              type="text"
              value={sessionCode}
              onChange={handleCodeInput}
              placeholder="000000"
              className="code-input"
              maxLength={6}
              autoFocus
            />
            <p className="form-hint">Enter the 6-digit code provided by the host</p>
          </div>

          <div className="form-group">
            <label htmlFor="userName">Your Name (Optional)</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
            />
            <p className="form-hint">This will be shown in the meeting transcript</p>
          </div>

          <button 
            type="submit"
            className="btn-primary btn-large"
            disabled={loading || sessionCode.length !== 6}
          >
            {loading ? 'Joining...' : '🚪 Join Meeting'}
          </button>
        </form>

        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-link"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default JoinSession;
