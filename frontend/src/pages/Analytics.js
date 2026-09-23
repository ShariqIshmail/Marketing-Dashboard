import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCampaign, setNewCampaign] = useState({ name: '', platform: 'manual' });
  const [newMetric, setNewMetric] = useState({ campaign_id: '', date: '', spend: '', revenue: '' });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get('/api/campaigns');
      setCampaigns(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setLoading(false);
    }
  };

  const addCampaign = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/campaigns', newCampaign);
      setNewCampaign({ name: '', platform: 'manual' });
      fetchCampaigns();
    } catch (err) {
      alert('Error adding campaign: ' + err.message);
    }
  };

  const addMetric = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/metrics', {
        ...newMetric,
        campaign_id: parseInt(newMetric.campaign_id),
        spend: parseFloat(newMetric.spend),
        revenue: parseFloat(newMetric.revenue)
      });
      setNewMetric({ campaign_id: '', date: '', spend: '', revenue: '' });
    } catch (err) {
      alert('Error adding metric: ' + err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="analytics">
      <h2 style={{ marginBottom: '2rem', color: '#e0e0e0' }}>📈 Analytics & Campaigns</h2>

      <div className="grid cols-2">
        {/* Add Campaign Form */}
        <div className="card">
          <h3 className="card-title">Create Campaign</h3>
          <form onSubmit={addCampaign} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input
                type="text"
                className="form-input"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Platform</label>
              <select
                className="form-select"
                value={newCampaign.platform}
                onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })}
              >
                <option value="manual">Manual Entry</option>
                <option value="google_ads">Google Ads</option>
                <option value="meta_ads">Meta Ads</option>
              </select>
            </div>
            <button type="submit" className="button button-primary" style={{ width: '100%' }}>
              Create Campaign
            </button>
          </form>
        </div>

        {/* Add Metric Form */}
        <div className="card">
          <h3 className="card-title">Add Daily Metrics</h3>
          <form onSubmit={addMetric} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Campaign</label>
              <select
                className="form-select"
                value={newMetric.campaign_id}
                onChange={(e) => setNewMetric({ ...newMetric, campaign_id: e.target.value })}
                required
              >
                <option value="">Select a campaign...</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid cols-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newMetric.date}
                  onChange={(e) => setNewMetric({ ...newMetric, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Spend ($)</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  value={newMetric.spend}
                  onChange={(e) => setNewMetric({ ...newMetric, spend: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Revenue ($)</label>
              <input
                type="number"
                className="form-input"
                step="0.01"
                value={newMetric.revenue}
                onChange={(e) => setNewMetric({ ...newMetric, revenue: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="button button-primary" style={{ width: '100%' }}>
              Add Metrics
            </button>
          </form>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="card-title">All Campaigns</h3>
        <table className="table" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td><span className="badge badge-info">{c.platform}</span></td>
                <td><span className={`badge badge-${c.status === 'active' ? 'success' : 'warning'}`}>{c.status}</span></td>
                <td style={{ fontSize: '0.9rem', color: '#a0a0a0' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;
