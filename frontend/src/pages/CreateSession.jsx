import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from '../api/client';
import './SessionPages.css';

const CreateSession = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [sessionCode, setSessionCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects/');
      setProjects(response.data);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const createSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/sessions/create', {
        project_id: selectedProject ? parseInt(selectedProject) : null,
        module_type: 'physical_meeting'
      });

      setSessionCode(response.data.session_code);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const joinSession = () => {
    if (sessionCode) {
      navigate(`/meeting/${sessionCode}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionCode);
    alert('Session code copied to clipboard!');
  };

  const shareUrl = sessionCode ? `${window.location.origin}/meeting/${sessionCode}` : '';

  if (sessionCode) {
    return (
      <div className="session-page">
        <div className="session-card">
          <h1>Session Created! 🎉</h1>
          
          <div className="session-code-display">
            <h2>Session Code</h2>
            <div className="code-box">
              {sessionCode}
            </div>
            <button onClick={copyToClipboard} className="btn-secondary">
              📋 Copy Code
            </button>
          </div>

          <div className="qr-code-section">
            <h3>Scan to Join</h3>
            <div className="qr-code-wrapper">
              <QRCodeSVG 
                value={shareUrl} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="qr-hint">Share this QR code with meeting participants</p>
          </div>

          <div className="session-actions">
            <button onClick={joinSession} className="btn-primary">
              Join Meeting
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-page">
      <div className="session-card">
        <h1>Create Physical Meeting Session</h1>
        <p className="subtitle">Start a new real-time translation session</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="project">Link to Project (Optional)</label>
          <select
            id="project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="form-select"
          >
            <option value="">No project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <p className="form-hint">Associate this session with a project for better organization</p>
        </div>

        <button 
          onClick={createSession} 
          className="btn-primary btn-large"
          disabled={loading}
        >
          {loading ? 'Creating...' : '🚀 Create Session'}
        </button>

        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-link"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateSession;
