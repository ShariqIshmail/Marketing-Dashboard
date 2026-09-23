import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [news, setNews] = useState([]);
  const [latestRun, setLatestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningAgent, setRunningAgent] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [summaryRes, metricsRes, newsRes, agentRes] = await Promise.all([
        axios.get('/api/metrics/summary'),
        axios.get('/api/metrics?period=daily&limit=30'),
        axios.get('/api/news?limit=5'),
        axios.get('/api/agent/runs?limit=1')
      ]);

      setSummary(summaryRes.data);
      setMetrics(metricsRes.data);
      setNews(newsRes.data);
      if (agentRes.data.length > 0) {
        setLatestRun(agentRes.data[0]);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const triggerAgent = async () => {
    try {
      setRunningAgent(true);
      await axios.post('/api/agent/run');
      setTimeout(fetchDashboardData, 2000);
    } catch (err) {
      setError('Failed to trigger agent');
    } finally {
      setRunningAgent(false);
    }
  };

  if (loading) {
    return <div className="main-content"><p>Loading dashboard...</p></div>;
  }

  const spendVsRevenue = metrics.map(m => ({
    date: m.period ? m.period.split('T')[0] : '',
    spend: parseFloat(m.spend || 0),
    revenue: parseFloat(m.revenue || 0)
  })).slice(0, 30);

  const gaugeData = [
    { name: 'ROAS', value: Math.round((summary?.roas || 0) * 100) / 100, max: 5 },
    { name: 'ROI', value: Math.round((summary?.roi || 0) * 100) / 100, max: 300 }
  ];

  return (
    <div className="dashboard">
      {error && <div className="error-banner">{error}</div>}

      {/* Summary Cards */}
      <div className="grid cols-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Total Spend</span>
            <span>💰</span>
          </div>
          <div className="card-value">${summary?.total_spend?.toFixed(2) || '0.00'}</div>
          <div className="card-subtext">{summary?.active_campaigns || 0} active campaigns</div>
        </div>

        <div className="card highlighted">
          <div className="card-header">
            <span className="card-title">ROAS</span>
            <span>📊</span>
          </div>
          <div className="card-value">{(summary?.roas || 0).toFixed(2)}x</div>
          <div className="card-subtext">Revenue per $ spent</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">ROI</span>
            <span>📈</span>
          </div>
          <div className="card-value">{(summary?.roi || 0).toFixed(1)}%</div>
          <div className="card-subtext">Return on investment</div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue</span>
            <span>💵</span>
          </div>
          <div className="card-value">${summary?.total_revenue?.toFixed(2) || '0.00'}</div>
          <div className="card-subtext">{summary?.total_conversions || 0} conversions</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid cols-2">
        {/* Spend vs Revenue Chart */}
        <div className="card">
          <h3 className="card-title">Spend vs Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={spendVsRevenue}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(42, 63, 95, 0.5)" />
              <XAxis dataKey="date" stroke="#a0a0a0" style={{ fontSize: '0.8rem' }} />
              <YAxis stroke="#a0a0a0" style={{ fontSize: '0.8rem' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2749', border: '1px solid #2a3f5f', borderRadius: '8px' }}
                labelStyle={{ color: '#e0e0e0' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSpend)"
                name="Spend"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ROI/ROAS Gauges */}
        <div className="card">
          <h3 className="card-title">Key Performance Gauges</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h4 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>ROAS</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {(summary?.roas || 0).toFixed(2)}x
              </div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.5rem' }}>
                Target: 3.0x
              </p>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h4 style={{ color: '#06b6d4', marginBottom: '0.5rem' }}>ROI</h4>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {(summary?.roi || 0).toFixed(1)}%
              </div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginTop: '0.5rem' }}>
                Target: 100%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - News & Agent */}
      <div className="grid cols-2">
        {/* Latest News */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">Latest Industry News</h3>
            <span style={{ fontSize: '1.5rem' }}>📰</span>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {news.length > 0 ? (
              news.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
                  <p style={{ fontWeight: '600', color: '#e0e0e0', marginBottom: '0.3rem' }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                    {item.summary || 'No summary available'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span className={`badge badge-${item.category === 'trend' ? 'info' : 'warning'}`}>
                      {item.category}
                    </span>
                    {item.sentiment && (
                      <span className={`badge badge-${item.sentiment === 'positive' ? 'success' : item.sentiment === 'negative' ? 'error' : 'warning'}`}>
                        {item.sentiment}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '1rem' }}>
                No news items yet. Run the agent to fetch news.
              </p>
            )}
          </div>
        </div>

        {/* Agent Activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="card-title">Agent Activity</h3>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
          </div>

          {latestRun && (
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Last Run</span>
                <span className={`badge badge-${latestRun.status === 'completed' ? 'success' : 'warning'}`}>
                  {latestRun.status}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                {new Date(latestRun.started_at).toLocaleString()}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#e0e0e0' }}>
                {latestRun.summary || 'No summary'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#a0a0a0' }}>
                <span>📰 {latestRun.news_count || 0} items</span>
                <span>📊 {latestRun.metrics_found || 0} metrics</span>
              </div>
            </div>
          )}

          <button
            className="button button-primary"
            onClick={triggerAgent}
            disabled={runningAgent}
            style={{ width: '100%' }}
          >
            {runningAgent ? (
              <>
                <span className="loading-spinner"></span>
                Running...
              </>
            ) : (
              <>▶️ Run Agent Now</>
            )}
          </button>

          <p style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '1rem', textAlign: 'center' }}>
            Automatically runs daily at 7:00 AM
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
