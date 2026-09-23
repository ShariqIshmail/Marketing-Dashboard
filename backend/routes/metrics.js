const express = require('express');
const pool = require('../db/connection');
const router = express.Router();

// Helper function to calculate metrics
const calculateMetrics = (rows) => {
  if (rows.length === 0) return { spend: 0, revenue: 0, roi: 0, roas: 0, conversions: 0 };

  const spend = rows.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
  const revenue = rows.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
  const conversions = rows.reduce((sum, row) => sum + parseInt(row.conversions || 0), 0);
  const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
  const roas = spend > 0 ? revenue / spend : 0;

  return { spend, revenue, roi, roas, conversions };
};

// GET all metrics (aggregated)
router.get('/', async (req, res) => {
  try {
    const { period = 'daily', campaign_id } = req.query;

    let query = `
      SELECT
        CASE
          WHEN $1 = 'daily' THEN date
          WHEN $1 = 'weekly' THEN date_trunc('week', date)::date
          WHEN $1 = 'monthly' THEN date_trunc('month', date)::date
        END as period,
        campaign_id,
        SUM(spend) as spend,
        SUM(revenue) as revenue,
        SUM(conversions) as conversions,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks
      FROM ad_metrics
    `;

    const params = [period];

    if (campaign_id) {
      query += ` WHERE campaign_id = $2`;
      params.push(campaign_id);
    }

    query += ` GROUP BY period, campaign_id ORDER BY period DESC`;

    const result = await pool.query(query, params);

    // Calculate ROI and ROAS for each row
    const withMetrics = result.rows.map(row => ({
      ...row,
      spend: parseFloat(row.spend || 0),
      revenue: parseFloat(row.revenue || 0),
      roi: parseFloat(row.spend) > 0 ? (((parseFloat(row.revenue) - parseFloat(row.spend)) / parseFloat(row.spend)) * 100) : 0,
      roas: parseFloat(row.spend) > 0 ? parseFloat(row.revenue) / parseFloat(row.spend) : 0
    }));

    res.json(withMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET summary metrics for dashboard
router.get('/summary', async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const today = new Date();

    let startDate;
    if (period === 'daily') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'weekly') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const result = await pool.query(
      `SELECT
        SUM(spend) as total_spend,
        SUM(revenue) as total_revenue,
        SUM(conversions) as total_conversions,
        COUNT(DISTINCT campaign_id) as campaign_count,
        AVG(CASE WHEN spend > 0 THEN revenue/spend ELSE 0 END) as avg_roas,
        COUNT(*) as metric_count
      FROM ad_metrics
      WHERE date >= $1`,
      [startDate.toISOString().split('T')[0]]
    );

    const data = result.rows[0];
    const spend = parseFloat(data.total_spend || 0);
    const revenue = parseFloat(data.total_revenue || 0);

    res.json({
      period: period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
      total_spend: spend,
      total_revenue: revenue,
      roi: spend > 0 ? (((revenue - spend) / spend) * 100) : 0,
      roas: spend > 0 ? (revenue / spend) : 0,
      total_conversions: parseInt(data.total_conversions || 0),
      active_campaigns: parseInt(data.campaign_count || 0),
      avg_roas: parseFloat(data.avg_roas || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE metric entry
router.post('/', async (req, res) => {
  try {
    const { campaign_id, date, spend, revenue, impressions, clicks, conversions } = req.body;

    if (!campaign_id || !date) {
      return res.status(400).json({ error: 'campaign_id and date are required' });
    }

    const result = await pool.query(
      `INSERT INTO ad_metrics (campaign_id, date, spend, revenue, impressions, clicks, conversions, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')
       ON CONFLICT (campaign_id, date) DO UPDATE
       SET spend = $3, revenue = $4, impressions = $5, clicks = $6, conversions = $7, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [campaign_id, date, spend || 0, revenue || 0, impressions || 0, clicks || 0, conversions || 0]
    );

    const metric = result.rows[0];

    // Calculate ROI and ROAS
    const spend_val = parseFloat(metric.spend || 0);
    const revenue_val = parseFloat(metric.revenue || 0);

    res.status(201).json({
      ...metric,
      roi: spend_val > 0 ? (((revenue_val - spend_val) / spend_val) * 100) : 0,
      roas: spend_val > 0 ? (revenue_val / spend_val) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET metrics for a specific campaign
router.get('/campaign/:campaign_id', async (req, res) => {
  try {
    const { campaign_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM ad_metrics WHERE campaign_id = $1 ORDER BY date DESC',
      [campaign_id]
    );

    const withMetrics = result.rows.map(row => ({
      ...row,
      spend: parseFloat(row.spend || 0),
      revenue: parseFloat(row.revenue || 0),
      roi: parseFloat(row.spend) > 0 ? (((parseFloat(row.revenue) - parseFloat(row.spend)) / parseFloat(row.spend)) * 100) : 0,
      roas: parseFloat(row.spend) > 0 ? parseFloat(row.revenue) / parseFloat(row.spend) : 0
    }));

    res.json(withMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
