const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { db, DB_PATH } = require('./db');
const { syncAllConfigured } = require('./services/sync');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/analytics'));
app.use('/api/integrations', require('./routes/integrations'));

app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'OK', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', database: 'disconnected', error: err.message });
  }
});

// Serve the built frontend when it exists (npm run build), so one process can host everything.
const dist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(dist));
app.get(/^\/(?!api|health).*/, (req, res, next) => {
  res.sendFile(path.join(dist, 'index.html'), (err) => err && next());
});

app.listen(PORT, () => {
  console.log(`\nAds dashboard API running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});

const schedule = process.env.SYNC_SCHEDULE || '0 */6 * * *';
if (schedule !== 'off') {
  cron.schedule(schedule, async () => {
    const results = await syncAllConfigured();
    if (results.length) console.log('[sync]', JSON.stringify(results));
  });
  console.log(`Auto-sync schedule: "${schedule}"`);
}
