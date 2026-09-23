const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Database connection
const pool = require('./db/connection');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/news', require('./routes/news'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/slack', require('./routes/slack'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Marketing Dashboard API',
    version: '0.1.0',
    features: [
      'Campaign management',
      'Ad metrics tracking',
      'News & competitor monitoring',
      'CrewAI agent orchestration',
      'Slack integration',
      'ROI/ROAS analytics'
    ]
  });
});

// Health check with database verification
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      services: {
        backend: 'running',
        agent_service: process.env.AGENT_SERVICE_HOST || 'http://localhost:5001'
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Marketing Dashboard Backend running on http://localhost:${PORT}`);
  console.log(`  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`  Agent Service: ${process.env.AGENT_SERVICE_HOST || 'http://localhost:5001'}`);
  console.log('\nEndpoints:');
  console.log(`  GET  http://localhost:${PORT}/`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/campaigns`);
  console.log(`  GET  http://localhost:${PORT}/api/metrics`);
  console.log(`  GET  http://localhost:${PORT}/api/news`);
  console.log(`  GET  http://localhost:${PORT}/api/agent/runs`);
  console.log();
});

// Schedule agent to run daily at 7 AM (if schedule is set)
if (process.env.AGENT_RUN_SCHEDULE) {
  cron.schedule(process.env.AGENT_RUN_SCHEDULE, async () => {
    console.log('\n[CRON] Triggering scheduled agent run...');
    try {
      const response = await axios.post(`${process.env.AGENT_SERVICE_HOST || 'http://localhost:5001'}/run-crew`);
      console.log('[CRON] Agent run completed:', response.data.status);
    } catch (error) {
      console.error('[CRON] Error triggering agent:', error.message);
    }
  });
  console.log(`\n✓ Agent scheduled with cron: "${process.env.AGENT_RUN_SCHEDULE}"`);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await pool.end();
  process.exit(0);
});
