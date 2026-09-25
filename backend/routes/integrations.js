const express = require('express');
const { db } = require('../db');
const integrations = require('../integrations');
const { syncPlatform } = require('../services/sync');

const router = express.Router();

// Connection status per platform, including which .env keys are still missing.
router.get('/', (req, res) => {
  const lastRun = db.prepare(`SELECT * FROM sync_runs WHERE platform = ? ORDER BY id DESC LIMIT 1`);
  const lastSuccess = db.prepare(`SELECT * FROM sync_runs WHERE platform = ? AND status = 'success' ORDER BY id DESC LIMIT 1`);
  const campaignCount = db.prepare(`SELECT COUNT(*) AS n FROM campaigns WHERE platform = ?`);

  const platforms = Object.entries(integrations).map(([key, c]) => {
    const last = lastRun.get(key) || null;
    return {
      key,
      label: c.label,
      configured: c.isConfigured(),
      env_keys: c.ENV_KEYS,
      optional_env_keys: c.OPTIONAL_ENV_KEYS,
      missing_env_keys: c.ENV_KEYS.filter((k) => !process.env[k]),
      last_run: last,
      last_success: lastSuccess.get(key) || null,
      campaigns: campaignCount.get(key).n,
    };
  });

  res.json({
    platforms,
    failed_count: platforms.filter((p) => p.last_run?.status === 'failed').length,
  });
});

router.post('/:platform/sync', async (req, res) => {
  try {
    res.json(await syncPlatform(req.params.platform));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
