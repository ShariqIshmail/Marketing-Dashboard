import React, { useState, useEffect } from 'react';
import axios from 'axios';

function News() {
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async () => {
    try {
      const url = category ? `/api/news?category=${category}` : '/api/news';
      const res = await axios.get(url);
      setNews(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching news:', err);
      setLoading(false);
    }
  };

  if (loading) return <p>Loading news...</p>;

  return (
    <div className="news">
      <h2 style={{ marginBottom: '1rem', color: '#e0e0e0' }}>📰 News & Trends</h2>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          className={`button ${category === '' ? 'button-primary' : 'button-secondary'}`}
          onClick={() => setCategory('')}
        >
          All News
        </button>
        <button
          className={`button ${category === 'trend' ? 'button-primary' : 'button-secondary'}`}
          onClick={() => setCategory('trend')}
        >
          Trends
        </button>
        <button
          className={`button ${category === 'competitor' ? 'button-primary' : 'button-secondary'}`}
          onClick={() => setCategory('competitor')}
        >
          Competitors
        </button>
      </div>

      <div className="grid cols-1">
        {news.length > 0 ? (
          news.map((item) => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ color: '#e0e0e0', marginBottom: '0.5rem', flex: 1 }}>{item.title}</h3>
                <div style={{ whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                  <span className={`badge badge-${item.category === 'trend' ? 'info' : 'warning'}`}>
                    {item.category}
                  </span>
                </div>
              </div>

              <p style={{ color: '#a0a0a0', marginBottom: '1rem', lineHeight: '1.6' }}>
                {item.summary || item.url}
              </p>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {item.competitor_name && (
                  <span className="badge badge-warning">
                    {item.competitor_name}
                  </span>
                )}
                {item.sentiment && (
                  <span className={`badge badge-${item.sentiment === 'positive' ? 'success' : item.sentiment === 'negative' ? 'error' : 'warning'}`}>
                    {item.sentiment}
                  </span>
                )}
                <span style={{ color: '#a0a0a0', fontSize: '0.85rem', marginLeft: 'auto' }}>
                  {new Date(item.found_at).toLocaleString()}
                </span>
              </div>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-secondary button-small"
                  style={{ marginTop: '1rem' }}
                >
                  Read More →
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#a0a0a0' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📭 No news items yet</p>
            <p>Run the agent to fetch industry news and competitor updates.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default News;
