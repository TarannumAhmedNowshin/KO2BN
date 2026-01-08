import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/client';
import './PhysicalMeetingPage.css';

const PhysicalMeetingPage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [session, setSession] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [speakerName, setSpeakerName] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  
  const isActive = (path) => location.pathname === path;
  
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!sessionCode) {
      setError('No session code provided');
      return;
    }

    // Check if Web Speech API is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecognitionSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // Fetch session details
    fetchSession();
    
    // Connect to WebSocket
    connectWebSocket();

    return () => {
      // Cleanup WebSocket on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Cleanup speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sessionCode]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/sessions/${sessionCode}`);
      setSession(response.data);
      
      // Fetch existing transcripts
      const transcriptsResponse = await axios.get(`/api/sessions/${sessionCode}/transcripts`);
      setTranscripts(transcriptsResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load session');
    }
  };

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:8000/ws/session/${sessionCode}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. The session may have ended.');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Don't attempt reconnect if there's already an error (session ended, etc.)
      if (!error) {
        // Attempt reconnect after 3 seconds (max 3 attempts)
        const reconnectAttempts = wsRef.current?.reconnectAttempts || 0;
        if (reconnectAttempts < 3) {
          setTimeout(() => {
            console.log(`Reconnect attempt ${reconnectAttempts + 1}/3`);
            const newWs = connectWebSocket();
            if (newWs) {
              newWs.reconnectAttempts = reconnectAttempts + 1;
            }
          }, 3000);
        } else {
          setError('Connection lost. Please create a new session.');
        }
      }
    };

    wsRef.current = ws;
    return ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        console.log('Connected to session:', data.session_code);
        break;
      
      case 'transcript':
        // Add new transcript
        const newTranscript = {
          id: data.transcript_id,
          speaker_name: data.speaker_name,
          original_text: data.original_text,
          original_language: data.original_language,
          translated_text_ko: data.translations.ko,
          translated_text_bn: data.translations.bn,
          translated_text_en: data.translations.en,
          timestamp: data.timestamp,
          audio_files: data.audio_files
        };
        
        setTranscripts(prev => [...prev, newTranscript]);
        
        // Auto-play audio if available
        if (data.audio_files) {
          playTranslatedAudio(data.audio_files);
        }
        break;
      
      case 'error':
        setError(data.message);
        break;
      
      case 'user_disconnected':
        console.log(data.message);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const playTranslatedAudio = (audioFiles) => {
    // Play the first available audio translation
    for (const [lang, audioBase64] of Object.entries(audioFiles)) {
      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audio.play().catch(err => console.error('Error playing audio:', err));
        break;
      }
    }
  };

  const startRecording = () => {
    try {
      console.log('Starting speech recognition...');
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Auto-detect would be ideal, but we'll use English as default
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        console.log('Recognized text:', transcript, 'Confidence:', confidence);
        
        // Send text to server
        sendTextToServer(transcript, 'en');
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecording(false);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log('Stop recording called');
    if (recognitionRef.current) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
    }
  };

  const sendTextToServer = (text, language) => {
    try {
      console.log('Sending text to server:', text);
      
      if (!text || text.trim().length === 0) {
        console.warn('Empty text, not sending');
        return;
      }
      
      // Send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('Sending text via WebSocket...');
        wsRef.current.send(JSON.stringify({
          type: 'text',
          text: text,
          language: language,
          speaker_name: speakerName || 'Anonymous',
          user_id: null
        }));
        console.log('✅ Text sent successfully!');
      } else {
        console.error('WebSocket not open!', wsRef.current?.readyState);
        setError('Connection lost. Please rejoin the session.');
      }
    } catch (err) {
      console.error('Error sending text:', err);
      setError('Failed to send message');
    }
  };

  const endSession = async () => {
    try {
      await axios.post(`/api/sessions/${sessionCode}/end`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to end session');
    }
  };

  const getLanguageLabel = (lang) => {
    const labels = {
      'ko': 'Korean',
      'bn': 'Bengali',
      'en': 'English',
      'korean': 'Korean',
      'bengali': 'Bengali',
      'english': 'English'
    };
    return labels[lang] || lang;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (error && !session) {
    return (
      <div className="meeting-wrapper">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">K2</div>
            <div className="logo-text">
              <h1>KO2BN</h1>
              <span>Translation</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-item ${isActive('/translate') ? 'active' : ''}`}
            onClick={() => navigate('/translate')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Translation</span>
          </button>

          <button 
            className={`nav-item ${isActive('/documents') ? 'active' : ''}`}
            onClick={() => navigate('/documents')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span>Documents</span>
          </button>

          <button 
            className={`nav-item ${location.pathname.includes('session') || location.pathname.includes('meeting') ? 'active' : ''}`}
            onClick={() => navigate('/create-session')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
              <polyline points="17 2 12 7 7 2"/>
            </svg>
            <span>Meetings</span>
          </button>

          <button 
            className={`nav-item ${isActive('/glossary') ? 'active' : ''}`}
            onClick={() => navigate('/glossary')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Glossary</span>
          </button>

          {user?.role === 'admin' && (
            <button 
              className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l-4.2 4.2M1 12h6m6 0h6m-13.2-5.2l4.2 4.2m0 6l4.2 4.2"/>
              </svg>
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        <button className="nav-item sign-out" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="meeting-header">
          <div className="meeting-info">
            <h1>Physical Meeting Session</h1>
            <div className="session-details">
              <span className="session-code">Code: {sessionCode}</span>
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>
          </div>
          <button className="btn-danger" onClick={endSession}>
            End Session
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="meeting-content">
        <div className="controls-panel">
          <div className="speaker-input">
            <label htmlFor="speakerName">Your Name:</label>
            <input
              id="speakerName"
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected || !recognitionSupported}
          >
            {!recognitionSupported ? '❌ Speech Not Supported' :
             isRecording ? '🔴 Stop Recording' : '🎤 Click to Speak'}
          </button>

          <p className="record-hint">
            {!recognitionSupported ? 'Speech recognition not available in this browser' :
             isRecording ? 'Speak now... Click again to stop' : 'Click to start speaking'}
          </p>
        </div>

        <div className="transcripts-panel">
          <h2>Live Transcripts</h2>
          <div className="transcripts-grid">
            <div className="transcript-column">
              <h3>🇰🇷 Korean</h3>
              <div className="transcript-messages">
                {transcripts.map((transcript, index) => (
                  <div key={index} className="transcript-message">
                    <div className="message-speaker">{transcript.speaker_name}</div>
                    <div className="message-text">{transcript.translated_text_ko}</div>
                    <div className="message-time">
                      {new Date(transcript.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="transcript-column">
              <h3>🇧🇩 Bengali</h3>
              <div className="transcript-messages">
                {transcripts.map((transcript, index) => (
                  <div key={index} className="transcript-message">
                    <div className="message-speaker">{transcript.speaker_name}</div>
                    <div className="message-text">{transcript.translated_text_bn}</div>
                    <div className="message-time">
                      {new Date(transcript.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="transcript-column">
              <h3>🇺🇸 English</h3>
              <div className="transcript-messages">
                {transcripts.map((transcript, index) => (
                  <div key={index} className="transcript-message">
                    <div className="message-speaker">{transcript.speaker_name}</div>
                    <div className="message-text">{transcript.translated_text_en}</div>
                    <div className="message-time">
                      {new Date(transcript.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PhysicalMeetingPage;
