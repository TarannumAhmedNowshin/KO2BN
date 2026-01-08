import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import './GlossaryPage.css';

const GlossaryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [glossaryTerms, setGlossaryTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  
  // Form fields
  const [sourceTerm, setSourceTerm] = useState('');
  const [targetTerm, setTargetTerm] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ko');
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ko', name: 'Korean (한국어)' },
    { code: 'bn', name: 'Bangla (বাংলা)' },
  ];

  useEffect(() => {
    initializeProject();
  }, []);

  const initializeProject = async () => {
    if (!projectId) return;
    
    try {
      // Get existing projects
      const response = await client.get('/api/projects/');
      
      if (response.data.length === 0) {
        // Create default project if none exists
        const newProject = await client.post('/api/projects/', {
          name: 'Default Project',
          description: 'Auto-created default project for translations'
        });
        setProjectId(newProject.data.id);
        setProjects([newProject.data]);
      } else {
        // Use first project
        setProjectId(response.data[0].id);
        setProjects(response.data);
      }
    } catch (err) {
      console.error('Failed to initialize project:', err);
      setError('Failed to initialize project');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchGlossary();
    }
  }, [projectId]);

  const fetchGlossary = async () => {
    setLoading(true);
    try {
      const response = await client.get(`/api/glossary/project/${projectId}`);
      setGlossaryTerms(response.data);
    } catch (err) {
      console.error('Failed to fetch glossary:', err);
      // If project doesn't exist yet, it's okay
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to fetch glossary');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async (e) => {
    e.preventDefault();
    
    if (!sourceTerm.trim() || !targetTerm.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await client.post(`/api/glossary/project/${projectId}`, {
        source_term: sourceTerm,
        target_term: targetTerm,
        source_lang: sourceLang,
        target_lang: targetLang,
      });

      setSourceTerm('');
      setTargetTerm('');
      setShowAddModal(false);
      fetchGlossary();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add term');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTerm = async (e) => {
    e.preventDefault();
    
    if (!sourceTerm.trim() || !targetTerm.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await client.put(`/api/glossary/${editingTerm.id}`, {
        source_term: sourceTerm,
        target_term: targetTerm,
        source_lang: sourceLang,
        target_lang: targetLang,
      });

      setSourceTerm('');
      setTargetTerm('');
      setEditingTerm(null);
      fetchGlossary();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update term');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerm = async (termId) => {
    if (!confirm('Are you sure you want to delete this term?')) {
      return;
    }

    setLoading(true);
    try {
      await client.delete(`/api/glossary/${termId}`);
      fetchGlossary();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete term');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setSourceTerm('');
    setTargetTerm('');
    setSourceLang('en');
    setTargetLang('ko');
    setEditingTerm(null);
    setShowAddModal(true);
    setError('');
  };

  const openEditModal = (term) => {
    setSourceTerm(term.source_term);
    setTargetTerm(term.target_term);
    setSourceLang(term.source_lang);
    setTargetLang(term.target_lang);
    setEditingTerm(term);
    setShowAddModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingTerm(null);
    setError('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const getLangName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  return (
    <div className="glossary-wrapper">
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
            className={`nav-item ${isActive('/archive') ? 'active' : ''}`}
            onClick={() => navigate('/archive')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>Archive</span>
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
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
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
            <input type="text" placeholder="Search glossary terms..." />
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

        {/* Glossary Content */}
        <div className="glossary-content">
          <div className="page-header">
            <div>
              <h2>Glossary Management</h2>
              <p>Manage custom terminology for consistent translations</p>
            </div>
            <button className="btn-add" onClick={openAddModal}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Term
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading && !showAddModal ? (
            <div className="loading">Loading glossary...</div>
          ) : glossaryTerms.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <h3>No glossary terms yet</h3>
              <p>Add custom terms to improve translation accuracy</p>
              <button className="btn-add" onClick={openAddModal}>
                Add Your First Term
              </button>
            </div>
          ) : (
            <div className="glossary-table-wrapper">
              <table className="glossary-table">
                <thead>
                  <tr>
                    <th>Source Term</th>
                    <th>Target Term</th>
                    <th>Languages</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {glossaryTerms.map((term) => (
                    <tr key={term.id}>
                      <td className="term-cell">{term.source_term}</td>
                      <td className="term-cell">{term.target_term}</td>
                      <td className="lang-cell">
                        {getLangName(term.source_lang)} → {getLangName(term.target_lang)}
                      </td>
                      <td className="date-cell">
                        {new Date(term.created_at).toLocaleDateString()}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-edit"
                          onClick={() => openEditModal(term)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteTerm(term.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTerm ? 'Edit Term' : 'Add New Term'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={editingTerm ? handleEditTerm : handleAddTerm}>
              <div className="form-group">
                <label>Source Language</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Source Term</label>
                <input
                  type="text"
                  value={sourceTerm}
                  onChange={(e) => setSourceTerm(e.target.value)}
                  placeholder="Enter term in source language"
                  required
                />
              </div>

              <div className="form-group">
                <label>Target Language</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Target Term</label>
                <input
                  type="text"
                  value={targetTerm}
                  onChange={(e) => setTargetTerm(e.target.value)}
                  placeholder="Enter term in target language"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingTerm ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlossaryPage;
