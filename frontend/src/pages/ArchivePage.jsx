import React, { useState, useEffect } from 'react';
import axios from '../api/client';
import './ArchivePage.css';

const ArchivePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  
  // Filters
  const [projectId, setProjectId] = useState('');
  const [module, setModule] = useState('');
  const [sourceLang, setSourceLang] = useState('');
  const [targetLang, setTargetLang] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Projects for dropdown
  const [projects, setProjects] = useState([]);
  
  // Selected record for detail view
  const [selectedRecord, setSelectedRecord] = useState(null);
  
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
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search keyword');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        query: searchQuery,
      });
      
      if (projectId) params.append('project_id', projectId);
      if (module) params.append('module', module);
      if (sourceLang) params.append('source_lang', sourceLang);
      if (targetLang) params.append('target_lang', targetLang);
      if (startDate) params.append('start_date', new Date(startDate).toISOString());
      if (endDate) params.append('end_date', new Date(endDate).toISOString());
      
      const response = await axios.get(
        `/api/archive/search?${params.toString()}`
      );
      
      setResults(response.data.results);
      setTotalResults(response.data.total_results);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const clearFilters = () => {
    setProjectId('');
    setModule('');
    setSourceLang('');
    setTargetLang('');
    setStartDate('');
    setEndDate('');
  };
  
  const highlightText = (text, query) => {
    if (!text || !query) return text;
    
    // Simple case-insensitive text splitting
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <>
        {before}
        <mark>{match}</mark>
        {after.includes(query) ? highlightText(after, query) : after}
      </>
    );
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const getLanguageName = (code) => {
    const languages = {
      'ko': 'Korean',
      'bn': 'Bengali',
      'en': 'English'
    };
    return languages[code] || code;
  };
  
  const openRecordDetail = (record) => {
    setSelectedRecord(record);
  };
  
  const closeRecordDetail = () => {
    setSelectedRecord(null);
  };
  
  return (
    <div className="archive-page">
      <div className="archive-container">
        <h1>🔍 Archive & Global Search</h1>
        <p className="subtitle">Search across translations, documents, and meeting transcripts</p>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for keywords..."
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>
          
          <div className="filters-section">
            <h3>Filters</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Project</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label>Module</label>
                <select value={module} onChange={(e) => setModule(e.target.value)}>
                  <option value="">All Modules</option>
                  <option value="text">Text Translation</option>
                  <option value="document">Document Translation</option>
                  <option value="meeting">Physical Meeting</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Source Language</label>
                <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                  <option value="">Any</option>
                  <option value="ko">Korean</option>
                  <option value="bn">Bengali</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Target Language</label>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                  <option value="">Any</option>
                  <option value="ko">Korean</option>
                  <option value="bn">Bengali</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <button type="button" onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        
        {totalResults > 0 && (
          <div className="results-header">
            <h2>Found {totalResults} result{totalResults !== 1 ? 's' : ''}</h2>
          </div>
        )}
        
        <div className="results-list">
          {results.map((result) => (
            <div key={`${result.type}-${result.id}`} className="result-card" onClick={() => openRecordDetail(result)}>
              <div className="result-header">
                <span className={`module-badge ${result.type}`}>{result.module}</span>
                {result.project_name && (
                  <span className="project-badge">{result.project_name}</span>
                )}
                <span className="date-badge">{formatDate(result.created_at)}</span>
              </div>
              
              {result.type === 'meeting' ? (
                <div className="result-content">
                  <div className="speaker-info">
                    <strong>{result.speaker_name || 'Unknown'}</strong> (Session: {result.session_code})
                  </div>
                  <div className="transcript-preview">
                    <p><strong>Original ({getLanguageName(result.original_lang)}):</strong> {highlightText(result.original_text.substring(0, 200), searchQuery)}{result.original_text.length > 200 && '...'}</p>
                  </div>
                  <div className="matched-in">Matched in: <em>{result.matched_in}</em></div>
                </div>
              ) : (
                <div className="result-content">
                  <div className="language-info">
                    {result.source_lang && result.target_lang && (
                      <span>{getLanguageName(result.source_lang)} → {getLanguageName(result.target_lang)}</span>
                    )}
                  </div>
                  <div className="text-preview">
                    <p><strong>Source:</strong> {highlightText(result.source_text.substring(0, 200), searchQuery)}{result.source_text.length > 200 && '...'}</p>
                  </div>
                  <div className="matched-in">Matched in: <em>{result.matched_in}</em></div>
                </div>
              )}
              
              <div className="result-footer">
                <button className="view-full-btn">View Full Record →</button>
              </div>
            </div>
          ))}
        </div>
        
        {results.length === 0 && searchQuery && !loading && (
          <div className="no-results">
            <p>No results found for "{searchQuery}"</p>
            <p>Try different keywords or adjust your filters</p>
          </div>
        )}
      </div>
      
      {/* Modal for full record view */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={closeRecordDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeRecordDetail}>×</button>
            
            <h2>Full Record</h2>
            
            <div className="record-details">
              <div className="detail-row">
                <strong>Module:</strong> {selectedRecord.module}
              </div>
              {selectedRecord.project_name && (
                <div className="detail-row">
                  <strong>Project:</strong> {selectedRecord.project_name}
                </div>
              )}
              <div className="detail-row">
                <strong>Date:</strong> {formatDate(selectedRecord.created_at)}
              </div>
              
              {selectedRecord.type === 'meeting' ? (
                <>
                  <div className="detail-row">
                    <strong>Session Code:</strong> {selectedRecord.session_code}
                  </div>
                  <div className="detail-row">
                    <strong>Speaker:</strong> {selectedRecord.speaker_name || 'Unknown'}
                  </div>
                  <div className="detail-row">
                    <strong>Original ({getLanguageName(selectedRecord.original_lang)}):</strong>
                    <div className="detail-text">{highlightText(selectedRecord.original_text, searchQuery)}</div>
                  </div>
                  <div className="detail-row">
                    <strong>Korean Translation:</strong>
                    <div className="detail-text">{highlightText(selectedRecord.translated_text_ko, searchQuery)}</div>
                  </div>
                  <div className="detail-row">
                    <strong>Bengali Translation:</strong>
                    <div className="detail-text">{highlightText(selectedRecord.translated_text_bn, searchQuery)}</div>
                  </div>
                  <div className="detail-row">
                    <strong>English Translation:</strong>
                    <div className="detail-text">{highlightText(selectedRecord.translated_text_en, searchQuery)}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="detail-row">
                    <strong>Languages:</strong> {getLanguageName(selectedRecord.source_lang)} → {getLanguageName(selectedRecord.target_lang)}
                  </div>
                  <div className="detail-row">
                    <strong>Source Text:</strong>
                    <div className="detail-text">{highlightText(selectedRecord.source_text, searchQuery)}</div>
                  </div>
                  <div className="detail-row">
                    <strong>Translated Text:</strong>
                    <div className="detail-text">{highlightText(selectedRecord.translated_text, searchQuery)}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;
