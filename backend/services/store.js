// Writes normalized daily rows into campaigns + ad_metrics. Shared by sync and seed.
const { db, transaction } = require('../db');

const upsertCampaign = db.prepare(`
  INSERT INTO campaigns (platform, external_id, name, status)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (platform, external_id) DO UPDATE
    SET name = excluded.name, status = excluded.status, updated_at = CURRENT_TIMESTAMP
  RETURNING id
`);

const upsertMetric = db.prepare(`
  INSERT INTO ad_metrics (campaign_id, date, spend, impressions, clicks, conversions, revenue)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT (campaign_id, date) DO UPDATE
    SET spend = excluded.spend, impressions = excluded.impressions, clicks = excluded.clicks,
        conversions = excluded.conversions, revenue = excluded.revenue, updated_at = CURRENT_TIMESTAMP
`);

function saveRows(platform, rows) {
  return transaction(() => {
    const ids = new Map();
    for (const r of rows) {
      let id = ids.get(r.external_campaign_id);
      if (id === undefined) {
        id = upsertCampaign.get(platform, r.external_campaign_id, r.campaign_name, r.status || 'active').id;
        ids.set(r.external_campaign_id, id);
      }
      upsertMetric.run(id, r.date, r.spend, r.impressions, r.clicks, r.conversions, r.revenue);
    }
    return rows.length;
  });
}

module.exports = { saveRows };
