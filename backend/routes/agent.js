const express = require('express');
const axios = require('axios');
const pool = require('../db/connection');
const router = express.Router();

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_HOST || 'http://localhost:5001';

// POST - Trigger agent run
router.post('/run', async (req, res) => {
  try {
    console.log('[Agent] Triggering crew run...');

    // Start the run
    const agentResponse = await axios.post(`${AGENT_SERVICE_URL}/run-crew`);

    res.status(202).json({
      message: 'Agent run triggered',
      status: 'running',
      data: agentResponse.data
    });
  } catch (error) {
    console.error('[Agent] Error:', error.message);
    res.status(503).json({
      error: 'Failed to trigger agent run',
      details: error.message,
      agent_service: AGENT_SERVICE_URL
    });
  }
});

// GET - Fetch agent runs history
router.get('/runs', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT
        ar.*,
        COUNT(sp.id) as slack_posts_count
      FROM agent_runs ar
      LEFT JOIN slack_posts sp ON ar.id = sp.agent_run_id
      GROUP BY ar.id
      ORDER BY ar.started_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Fetch specific agent run with details
router.get('/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const run = await pool.query(
      'SELECT * FROM agent_runs WHERE id = $1',
      [id]
    );

    if (run.rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const posts = await pool.query(
      'SELECT * FROM slack_posts WHERE agent_run_id = $1 ORDER BY created_at DESC',
      [id]
    );

    const news = await pool.query(
      'SELECT * FROM news_items WHERE created_at >= $1 ORDER BY created_at DESC LIMIT 20',
      [run.rows[0].started_at]
    );

    res.json({
      run: run.rows[0],
      slack_posts: posts.rows,
      news_items: news.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Log an agent run (called by agent service)
router.post('/runs/log', async (req, res) => {
  try {
    const { status, summary, error, news_count, metrics_found } = req.body;

    const result = await pool.query(
      `INSERT INTO agent_runs (status, summary, error, news_count, metrics_found, finished_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [status || 'completed', summary || null, error || null, news_count || 0, metrics_found || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Agent service health check
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AGENT_SERVICE_URL}/health`);
    res.json({
      backend: 'healthy',
      agent_service: response.data
    });
  } catch (error) {
    res.status(503).json({
      backend: 'healthy',
      agent_service: 'unreachable',
      error: error.message
    });
  }
});

module.exports = router;
