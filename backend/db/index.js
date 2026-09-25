const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'ads.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS campaigns (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    platform    TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads', 'linkedin_ads')),
    external_id TEXT NOT NULL,
    name        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (platform, external_id)
  );

  CREATE TABLE IF NOT EXISTS ad_metrics (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    date        TEXT NOT NULL,
    spend       REAL NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks      INTEGER NOT NULL DEFAULT 0,
    conversions REAL NOT NULL DEFAULT 0,
    revenue     REAL NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (campaign_id, date)
  );

  CREATE TABLE IF NOT EXISTS sync_runs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    platform    TEXT NOT NULL,
    started_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    status      TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
    rows_synced INTEGER NOT NULL DEFAULT 0,
    error       TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics(date);
  CREATE INDEX IF NOT EXISTS idx_sync_runs_platform ON sync_runs(platform, started_at);
`);

// Run fn inside a transaction; rolls back on error.
function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, transaction, DB_PATH };
