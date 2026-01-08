import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import './GlossaryPage.css';

const GlossaryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
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

  const getLangName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  return (
    <div className="glossary-container">
      <nav className="navbar">
        <h1>KO2BN - Glossary Management</h1>
        <div className="nav-right">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => navigate('/translate')} className="btn-nav">Translation</button>
          <span className="user-info">{user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="glossary-content">
        <div className="glossary-header">
          <h2>Custom Terminology</h2>
          <button className="btn-add" onClick={openAddModal}>
            + Add Term
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && !showAddModal ? (
          <div className="loading">Loading glossary...</div>
        ) : glossaryTerms.length === 0 ? (
          <div className="empty-state">
            <p>No glossary terms yet</p>
            <p className="empty-hint">Add custom terms to improve translation accuracy</p>
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
