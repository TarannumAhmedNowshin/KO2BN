import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from '../api/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/analytics/overview');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h1>KO2BN</h1>
        <div className="nav-right">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h2>Dashboard</h2>
        
        {/* Stats Cards */}
        {!loading && analytics && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{analytics.user_stats.translations}</div>
              <div className="stat-label">My Translations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.user_stats.projects}</div>
              <div className="stat-label">My Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.overview.total_translations}</div>
              <div className="stat-label">Total Translations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{analytics.overview.recent_translations_30d}</div>
              <div className="stat-label">Last 30 Days</div>
            </div>
          </div>
        )}
        
        <div className="cards-grid">
          <div className="card" onClick={() => navigate('/translate')}>
            <div className="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3>Translate Text</h3>
            <p>Translate between Korean, Bangla, and English</p>
          </div>

          <div className="card" onClick={() => navigate('/glossary')}>
            <div className="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="10" y1="8" x2="16" y2="8"/>
                <line x1="10" y1="12" x2="16" y2="12"/>
                <line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
            </div>
            <h3>Glossary</h3>
            <p>Manage custom terminology for translations</p>
          </div>

          {user?.role === 'admin' && (
            <div className="card" onClick={() => navigate('/admin')}>
              <div className="card-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Admin Panel</h3>
              <p>Manage users and system settings</p>
            </div>
          )}

          <div className="card" onClick={() => navigate('/create-session')}>
            <div className="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="9"/>
                <line x1="12" y1="15" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
              </svg>
            </div>
            <h3>Physical Meeting</h3>
            <p>Start real-time translation session</p>
          </div>

          <div className="card" onClick={() => navigate('/join-session')}>
            <div className="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6"/>
                <path d="M10 14L21 3"/>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
            </div>
            <h3>Join Meeting</h3>
            <p>Enter session code to join</p>
          </div>

          <div className="card" onClick={() => navigate('/archive')}>
            <div className="card-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </div>
            <h3>Archive & Search</h3>
            <p>Search all translations and transcripts</p>
          </div>
        </div>

        {/* Analytics Charts */}
        {!loading && analytics && (
          <div className="analytics-section">
            <h3>Analytics Overview</h3>
            
            <div className="charts-grid">
              {/* Daily Translations Chart */}
              {analytics.daily_translations.length > 0 && (
                <div className="chart-card">
                  <h4>Daily Translations (Last 7 Days)</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.daily_translations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Language Pairs Chart */}
              {analytics.language_pairs.length > 0 && (
                <div className="chart-card">
                  <h4>Translation by Language Pair</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.language_pairs}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={(item) => `${item.source}→${item.target}`} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Users Chart */}
              {analytics.top_users.length > 0 && (
                <div className="chart-card">
                  <h4>Top Active Users</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.top_users} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="username" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>Your Account</h3>
          <div className="info-card">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Role:</strong> <span className={`role-badge ${user?.role}`}>{user?.role}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
