import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import News from './pages/News';
import AgentActivity from './pages/AgentActivity';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo] = useState({
    name: 'Admin',
    email: 'admin@example.com'
  });

  useEffect(() => {
    // Check backend health on load
    axios.get('/health')
      .then(() => {
        setLoading(false);
        setError(null);
      })
      .catch(err => {
        setLoading(false);
        setError('Backend service not available. Make sure the server is running on http://localhost:5000');
      });
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'news':
        return <News />;
      case 'agent':
        return <AgentActivity />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app error">
        <div className="error-box">
          <h2>⚠️ Connection Error</h2>
          <p>{error}</p>
          <p style={{ fontSize: '0.9em', marginTop: '1em', color: '#888' }}>
            Make sure PostgreSQL is running and the backend server is started with: <code>npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>📊 Dashboard</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="icon">🏠</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('analytics')}
          >
            <span className="icon">📈</span>
            <span>Analytics</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'news' ? 'active' : ''}`}
            onClick={() => setCurrentPage('news')}
          >
            <span className="icon">📰</span>
            <span>News & Trends</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'agent' ? 'active' : ''}`}
            onClick={() => setCurrentPage('agent')}
          >
            <span className="icon">🤖</span>
            <span>Agent Activity</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{userInfo.name.charAt(0)}</div>
            <div className="user-info">
              <p className="user-name">{userInfo.name}</p>
              <p className="user-email">{userInfo.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
