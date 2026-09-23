const express = require('express');
const axios = require('axios');
const pool = require('../db/connection');
const router = express.Router();

// POST - Trigger manual Slack summary
router.post('/trigger', async (req, res) => {
  try {
    const { agent_run_id } = req.body;

    if (!process.env.SLACK_WEBHOOK_URL) {
      return res.status(400).json({ error: 'SLACK_WEBHOOK_URL not configured' });
    }

    // Get latest metrics
    const metricsResult = await pool.query(`
      SELECT
        SUM(spend) as total_spend,
        SUM(revenue) as total_revenue,
        SUM(conversions) as total_conversions,
        COUNT(DISTINCT campaign_id) as campaign_count
      FROM ad_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
    `);

    const metrics = metricsResult.rows[0];
    const spend = parseFloat(metrics.total_spend || 0);
    const revenue = parseFloat(metrics.total_revenue || 0);
    const roi = spend > 0 ? (((revenue - spend) / spend) * 100) : 0;
    const roas = spend > 0 ? (revenue / spend) : 0;

    // Get latest news
    const newsResult = await pool.query(`
      SELECT * FROM news_items
      WHERE found_at >= NOW() - INTERVAL '24 hours'
      ORDER BY found_at DESC
      LIMIT 5
    `);

    // Build Slack message
    const message = {
      text: '📊 Marketing Dashboard Summary',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Marketing Dashboard Summary'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Weekly Metrics (Last 7 Days)*\n• Spend: $${spend.toFixed(2)}\n• Revenue: $${revenue.toFixed(2)}\n• ROI: ${roi.toFixed(2)}%\n• ROAS: ${roas.toFixed(2)}x\n• Conversions: ${parseInt(metrics.total_conversions || 0)}\n• Active Campaigns: ${parseInt(metrics.campaign_count || 0)}`
          }
        }
      ]
    };

    // Add news section if available
    if (newsResult.rows.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Latest Industry News*\n${newsResult.rows.map(item => `• ${item.title}`).join('\n')}`
        }
      });
    }

    // Post to Slack
    const slackResponse = await axios.post(process.env.SLACK_WEBHOOK_URL, message);

    // Log the post
    const logResult = await pool.query(
      `INSERT INTO slack_posts (agent_run_id, content, posted_at, success)
       VALUES ($1, $2, CURRENT_TIMESTAMP, true)
       RETURNING *`,
      [agent_run_id || null, JSON.stringify(message)]
    );

    res.json({
      message: 'Summary posted to Slack',
      slack_response: slackResponse.status,
      logged: logResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get latest Slack posts
router.get('/posts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT sp.*, ar.status as run_status
       FROM slack_posts sp
       LEFT JOIN agent_runs ar ON sp.agent_run_id = ar.id
       ORDER BY sp.posted_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
