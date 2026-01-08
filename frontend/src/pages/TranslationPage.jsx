import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import './TranslationPage.css';

const TranslationPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
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
    <div className="translation-container">
      <nav className="navbar">
        <h1>KO2BN - Translation</h1>
        <div className="nav-right">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <span className="user-info">{user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

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
  );
};

export default TranslationPage;
