import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import './TranslationPage.css';

const TranslationPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ko');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'bn', name: 'Bangla (বাংলা)' },
  ];

  const isActive = (path) => location.pathname === path;

  // Fetch translation history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await client.get('/api/translate/history?limit=20');
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    if (sourceLang === targetLang) {
      setError('Source and target languages must be different');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await client.post('/api/translate/', {
        text: sourceText,
        source_lang: sourceLang,
        target_lang: targetLang,
      });

      setTranslatedText(response.data.translated_text);
      fetchHistory(); // Refresh history after new translation
    } catch (err) {
      setError(err.response?.data?.detail || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    alert('Copied to clipboard!');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([translatedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `translation_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
        setError('Please select a PDF or DOCX file');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (sourceLang === targetLang) {
      setError('Source and target languages must be different');
      return;
    }

    setError('');
    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('source_lang', sourceLang);
      formData.append('target_lang', targetLang);

      const response = await client.post('/api/translate/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      setSourceText(response.data.original_text);
      setTranslatedText(response.data.translated_text);
      setUploadProgress(100);
      setSelectedFile(null);
      fetchHistory(); // Refresh history after new translation
    } catch (err) {
      setError(err.response?.data?.detail || 'Document translation failed');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLangName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const loadHistoryItem = (item) => {
    setSourceText(item.source_text);
    setTranslatedText(item.translated_text);
    setSourceLang(item.source_lang);
    setTargetLang(item.target_lang);
  };

  return (
    <div className="dashboard-wrapper">
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
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search translations, documents..." />
          </div>

          <div className="top-bar-right">
            <button className="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="notification-badge">3</span>
            </button>

            <button className="icon-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          <div className="page-header">
            <h2>Translation</h2>
            <p>Translate text instantly between Korean, Bangla, and English</p>
          </div>

      <div className="translation-layout">
        <div className="translation-main">
          <div className="mode-switcher">
            <button
              className={`mode-btn ${!uploadMode ? 'active' : ''}`}
              onClick={() => setUploadMode(false)}
            >
              Text Translation
            </button>
            <button
              className={`mode-btn ${uploadMode ? 'active' : ''}`}
              onClick={() => setUploadMode(true)}
            >
              Document Upload
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

        {!uploadMode ? (
          // Text Translation Mode
        <div className="translation-panel">
          <div className="language-selector">
            <div className="lang-select">
              <label>From:</label>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button className="swap-btn" onClick={handleSwapLanguages} title="Swap languages">
              ⇄
            </button>

            <div className="lang-select">
              <label>To:</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-areas">
            <div className="text-section">
              <label>Source Text</label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Enter text to translate..."
                rows="10"
              />
              <div className="char-count">{sourceText.length} characters</div>
            </div>

            <div className="text-section">
              <label>Translation</label>
              <textarea
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
                rows="10"
              />
              {translatedText && (
                <div className="action-buttons">
                  <button className="copy-btn" onClick={handleCopy}>Copy</button>
                  <button className="download-btn" onClick={handleDownload}>Download</button>
                </div>
              )}
            </div>
          </div>

          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={loading || !sourceText.trim()}
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>
        ) : (
          // Document Upload Mode
          <div className="translation-panel">
            <div className="language-selector">
              <div className="lang-select">
                <label>From:</label>
                <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <button className="swap-btn" onClick={handleSwapLanguages} title="Swap languages">
                ⇄
              </button>

              <div className="lang-select">
                <label>To:</label>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="file-upload-section">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="file-input-label">
                  <span className="upload-icon">📄</span>
                  <span>Choose PDF or DOCX file</span>
                </label>
              </div>

              {selectedFile && (
                <div className="selected-file">
                  <span className="file-name">📎 {selectedFile.name}</span>
                  <span className="file-size">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              {loading && uploadProgress > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              )}

              <button
                className="translate-btn"
                onClick={handleFileUpload}
                disabled={loading || !selectedFile}
              >
                {loading ? 'Processing...' : 'Upload & Translate'}
              </button>
            </div>

            {(sourceText || translatedText) && (
              <div className="text-areas">
                <div className="text-section">
                  <label>Extracted Text</label>
                  <textarea
                    value={sourceText}
                    readOnly
                    placeholder="Extracted text will appear here..."
                    rows="10"
                  />
                </div>

                <div className="text-section">
                  <label>Translation</label>
                  <textarea
                    value={translatedText}
                    readOnly
                    placeholder="Translation will appear here..."
                    rows="10"
                  />
                  {translatedText && (
                    <div className="action-buttons">
                      <button className="copy-btn" onClick={handleCopy}>Copy</button>
                      <button className="download-btn" onClick={handleDownload}>Download</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* History Sidebar */}
        <div className={`history-sidebar ${showHistory ? 'show' : 'hide'}`}>
          <div className="history-header">
            <h3>History</h3>
            <button 
              className="toggle-history" 
              onClick={() => setShowHistory(!showHistory)}
              title={showHistory ? 'Hide history' : 'Show history'}
            >
              {showHistory ? '→' : '←'}
            </button>
          </div>

          {showHistory && (
            <div className="history-list">
              {history.length === 0 ? (
                <p className="no-history">No translation history yet</p>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className="history-item"
                    onClick={() => loadHistoryItem(item)}
                  >
                    <div className="history-langs">
                      {getLangName(item.source_lang)} → {getLangName(item.target_lang)}
                    </div>
                    <div className="history-text">
                      {item.source_text.substring(0, 50)}
                      {item.source_text.length > 50 ? '...' : ''}
                    </div>
                    <div className="history-date">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationPage;
