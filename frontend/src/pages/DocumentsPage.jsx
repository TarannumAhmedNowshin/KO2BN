import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/client';
import './DocumentsPage.css';

const DocumentsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents/');
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/documents/stats/summary');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const viewDocumentDetails = async (docId) => {
    try {
      const response = await axios.get(`/api/documents/${docId}`);
      setSelectedDoc(response.data);
      setShowDetails(true);
    } catch (err) {
      console.error('Failed to fetch document details:', err);
      alert('Failed to load document details');
    }
  };

  const downloadDocument = async (docId, filename) => {
    try {
      const response = await axios.get(`/api/documents/${docId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download document:', err);
      alert('Failed to download document');
    }
  };

  const deleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`/api/documents/${docId}`);
      fetchDocuments();
      fetchStats();
      setShowDetails(false);
      setSelectedDoc(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="documents-wrapper">
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
      <main className="main-content">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-container">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="top-bar-right">
            <button className="icon-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notification-badge">4</span>
            </button>
            <button className="icon-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Documents Content */}
        <div className="documents-content">
          <div className="page-header">
            <div>
              <h2>My Documents</h2>
              <p>View and manage all your uploaded documents</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/translate')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Upload New Document
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="stats-row">
              <div className="stat-card-small">
                <div className="stat-icon-small">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="stat-info-small">
                  <div className="stat-value-small">{stats.total_documents}</div>
                  <div className="stat-label-small">Total Documents</div>
                </div>
              </div>
              
              <div className="stat-card-small">
                <div className="stat-icon-small success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="stat-info-small">
                  <div className="stat-value-small">{stats.translated_documents}</div>
                  <div className="stat-label-small">Translated</div>
                </div>
              </div>
              
              <div className="stat-card-small">
                <div className="stat-icon-small warning">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div className="stat-info-small">
                  <div className="stat-value-small">{stats.total_size_mb} MB</div>
                  <div className="stat-label-small">Storage Used</div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Grid */}
          <div className="documents-section">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3>No documents found</h3>
                <p>Upload your first document to get started with translation</p>
                <button className="btn-primary" onClick={() => navigate('/translate')}>
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="documents-grid">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="document-card">
                    <div className="document-icon">
                      {doc.file_type === 'pdf' ? (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <text x="8" y="16" fontSize="6" fill="currentColor">PDF</text>
                        </svg>
                      ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="8" y1="13" x2="16" y2="13"/>
                          <line x1="8" y1="17" x2="16" y2="17"/>
                        </svg>
                      )}
                    </div>
                    <div className="document-info">
                      <h3 className="document-title">{doc.original_filename}</h3>
                      <div className="document-meta">
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {formatDate(doc.upload_date)}
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                      <div className="document-langs">
                        <span className="lang-badge">{doc.source_lang.toUpperCase()}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span className="lang-badge">{doc.target_lang.toUpperCase()}</span>
                      </div>
                      {doc.has_translation && (
                        <div className="translation-badge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Translated
                        </div>
                      )}
                    </div>
                    <div className="document-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => viewDocumentDetails(doc.id)}
                        title="View Details"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => downloadDocument(doc.id, doc.original_filename)}
                        title="Download"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        onClick={() => deleteDocument(doc.id)}
                        title="Delete"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Document Details Modal */}
      {showDetails && selectedDoc && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDoc.original_filename}</h2>
              <button className="modal-close" onClick={() => setShowDetails(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Document Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">File Type:</span>
                    <span className="detail-value">{selectedDoc.file_type.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">File Size:</span>
                    <span className="detail-value">{formatFileSize(selectedDoc.file_size)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Upload Date:</span>
                    <span className="detail-value">{formatDate(selectedDoc.upload_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Translation:</span>
                    <span className="detail-value">
                      {selectedDoc.source_lang.toUpperCase()} → {selectedDoc.target_lang.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDoc.extracted_text && (
                <div className="detail-section">
                  <h3>Original Text</h3>
                  <div className="text-preview">
                    {selectedDoc.extracted_text}
                  </div>
                </div>
              )}

              {selectedDoc.translated_text && (
                <div className="detail-section">
                  <h3>Translated Text</h3>
                  <div className="text-preview">
                    {selectedDoc.translated_text}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => downloadDocument(selectedDoc.id, selectedDoc.original_filename)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
              <button className="btn-danger" onClick={() => deleteDocument(selectedDoc.id)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
