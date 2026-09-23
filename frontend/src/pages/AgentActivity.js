import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AgentActivity() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchRuns = async () => {
    try {
      const res = await axios.get('/api/agent/runs');
      setRuns(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching runs:', err);
      setLoading(false);
    }
  };

  const fetchRunDetails = async (runId) => {
    try {
      const res = await axios.get(`/api/agent/runs/${runId}`);
      setSelectedRun(res.data);
    } catch (err) {
      console.error('Error fetching run details:', err);
    }
  };

  if (loading) return <p>Loading agent activity...</p>;

  return (
    <div className="agent-activity">
      <h2 style={{ marginBottom: '2rem', color: '#e0e0e0' }}>🤖 Agent Activity</h2>

      <div className="grid cols-2">
        {/* Runs List */}
        <div className="card">
          <h3 className="card-title">Recent Runs</h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '1rem' }}>
            {runs.length > 0 ? (
              runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => fetchRunDetails(run.id)}
                  style={{
                    padding: '1rem',
                    marginBottom: '0.5rem',
                    backgroundColor: selectedRun?.run?.id === run.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: '1px solid #2a3f5f',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = selectedRun?.run?.id === run.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600' }}>Run #{run.id}</span>
                    <span className={`badge badge-${run.status === 'completed' ? 'success' : run.status === 'running' ? 'warning' : 'error'}`}>
                      {run.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#a0a0a0', marginBottom: '0.3rem' }}>
                    {new Date(run.started_at).toLocaleString()}
                  </p>
                  {run.summary && (
                    <p style={{ fontSize: '0.85rem', color: '#e0e0e0', marginTop: '0.3rem' }}>
                      {run.summary.substring(0, 100)}...
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#a0a0a0' }}>
                    <span>📰 {run.news_count || 0}</span>
                    <span>📊 {run.metrics_found || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '1rem' }}>
                No agent runs yet. Trigger an agent run to get started.
              </p>
            )}
          </div>
        </div>

        {/* Run Details */}
        <div className="card">
          <h3 className="card-title">Run Details</h3>
          {selectedRun ? (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
                <p style={{ color: '#a0a0a0', marginBottom: '0.3rem' }}>Status</p>
                <span className={`badge badge-${selectedRun.run.status === 'completed' ? 'success' : 'warning'}`}>
                  {selectedRun.run.status}
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
                <p style={{ color: '#a0a0a0', marginBottom: '0.3rem' }}>Started</p>
                <p style={{ color: '#e0e0e0' }}>
                  {new Date(selectedRun.run.started_at).toLocaleString()}
                </p>
              </div>

              {selectedRun.run.finished_at && (
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
                  <p style={{ color: '#a0a0a0', marginBottom: '0.3rem' }}>Finished</p>
                  <p style={{ color: '#e0e0e0' }}>
                    {new Date(selectedRun.run.finished_at).toLocaleString()}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
                <p style={{ color: '#a0a0a0', marginBottom: '0.3rem' }}>Summary</p>
                <p style={{ color: '#e0e0e0', lineHeight: '1.6' }}>
                  {selectedRun.run.summary || 'No summary available'}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a3f5f' }}>
                <p style={{ color: '#a0a0a0', marginBottom: '0.3rem' }}>Stats</p>
                <p style={{ color: '#e0e0e0', fontSize: '0.9rem' }}>
                  📰 {selectedRun.run.news_count} news items found<br />
                  📊 {selectedRun.run.metrics_found} metrics processed
                </p>
              </div>

              {selectedRun.slack_posts.length > 0 && (
                <div>
                  <p style={{ color: '#a0a0a0', marginBottom: '0.5rem' }}>Slack Posts</p>
                  {selectedRun.slack_posts.map((post, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: '#a0a0a0', marginBottom: '0.5rem' }}>
                      ✓ Posted at {new Date(post.posted_at).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '2rem 1rem' }}>
              Select a run to view details
            </p>
          )}
        </div>
      </div>

      {/* Latest News from Run */}
      {selectedRun && selectedRun.news_items.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 className="card-title">News Items from This Run</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {selectedRun.news_items.map((item) => (
              <div key={item.id} style={{ padding: '1rem', backgroundColor: '#1e2749', borderRadius: '8px', border: '1px solid #2a3f5f' }}>
                <p style={{ fontWeight: '600', color: '#e0e0e0', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  {item.title}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${item.category === 'trend' ? 'info' : 'warning'}`}>
                    {item.category}
                  </span>
                  {item.sentiment && (
                    <span className={`badge badge-${item.sentiment === 'positive' ? 'success' : 'error'}`}>
                      {item.sentiment}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentActivity;
