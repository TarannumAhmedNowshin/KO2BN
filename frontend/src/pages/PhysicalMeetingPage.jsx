import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/client';
import './PhysicalMeetingPage.css';

const PhysicalMeetingPage = () => {
  const { sessionCode } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [speakerName, setSpeakerName] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  
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

  if (error && !session) {
    return (
      <div className="meeting-container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="meeting-container">
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
  );
};

export default PhysicalMeetingPage;
