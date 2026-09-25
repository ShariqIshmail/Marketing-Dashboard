const { db } = require('../db');
const integrations = require('../integrations');
const { saveRows } = require('./store');
const { toISODate, addDays } = require('../utils/dates');

// Re-pull this many days each sync so late-attributed conversions get picked up.
const LOOKBACK_DAYS = Number(process.env.SYNC_LOOKBACK_DAYS) || 30;

const running = new Set();

// Turn an axios/API error into something readable for the Integrations page.
function describeError(err) {
  const body = err.response?.data;
  const apiMessage =
    body?.error?.message ||                       // Google, Meta
    body?.message ||                              // LinkedIn
    body?.error_description ||                    // OAuth token endpoint
    (typeof body === 'string' ? body.slice(0, 300) : null);
  const status = err.response?.status ? `HTTP ${err.response.status}: ` : '';
  return status + (apiMessage || err.message);
}

async function syncPlatform(platform) {
  const connector = integrations[platform];
  if (!connector) {
    const err = new Error(`Unknown platform "${platform}"`);
    err.status = 404;
    throw err;
  }
  if (!connector.isConfigured()) {
    const err = new Error(`${connector.label} is not configured. Add ${connector.ENV_KEYS.join(', ')} to .env and restart.`);
    err.status = 400;
    throw err;
  }
  if (running.has(platform)) {
    const err = new Error(`${connector.label} sync is already running`);
    err.status = 409;
    throw err;
  }

  running.add(platform);
  const runId = db.prepare(`INSERT INTO sync_runs (platform) VALUES (?) RETURNING id`).get(platform).id;
  const end = toISODate(new Date());
  const start = addDays(end, -(LOOKBACK_DAYS - 1));

  try {
    const rows = await connector.fetchDaily(start, end);
    const count = saveRows(platform, rows);
    db.prepare(`UPDATE sync_runs SET status = 'success', finished_at = CURRENT_TIMESTAMP, rows_synced = ? WHERE id = ?`)
      .run(count, runId);
    return { platform, status: 'success', rows_synced: count, start, end };
  } catch (err) {
    const message = describeError(err);
    db.prepare(`UPDATE sync_runs SET status = 'failed', finished_at = CURRENT_TIMESTAMP, error = ? WHERE id = ?`)
      .run(message, runId);
    const wrapped = new Error(`${connector.label} sync failed: ${message}`);
    wrapped.status = 502;
    throw wrapped;
  } finally {
    running.delete(platform);
  }
}

async function syncAllConfigured() {
  const results = [];
  for (const [platform, connector] of Object.entries(integrations)) {
    if (!connector.isConfigured()) continue;
    try {
      results.push(await syncPlatform(platform));
    } catch (err) {
      results.push({ platform, status: 'failed', error: err.message });
    }
  }
  return results;
}

module.exports = { syncPlatform, syncAllConfigured, describeError };
