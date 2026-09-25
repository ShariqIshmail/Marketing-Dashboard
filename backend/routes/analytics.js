const express = require('express');
const { db } = require('../db');
const integrations = require('../integrations');
const { withDerived, percentChange } = require('../utils/metrics');
const { rangeFromQuery, previousRange, addDays, parseISODate, toISODate } = require('../utils/dates');

const router = express.Router();

const PLATFORMS = Object.keys(integrations);
const TREND_METRICS = { spend: 'SUM(m.spend)', revenue: 'SUM(m.revenue)', conversions: 'SUM(m.conversions)', clicks: 'SUM(m.clicks)' };
const BUCKETS = {
  day: 'm.date',
  week: "date(m.date, '-' || ((CAST(strftime('%w', m.date) AS INTEGER) + 6) % 7) || ' days')", // Monday
  month: "strftime('%Y-%m-01', m.date)",
};
const SORTABLE = ['name', 'platform', 'status', 'spend', 'impressions', 'clicks', 'ctr', 'conversions', 'cpa', 'revenue', 'roas'];

// Optional ?platform= filter shared by every query.
function platformFilter(query) {
  return PLATFORMS.includes(query.platform) ? query.platform : null;
}

function totals(start, end, platform) {
  const row = db.prepare(`
    SELECT COALESCE(SUM(m.spend), 0) AS spend, COALESCE(SUM(m.revenue), 0) AS revenue,
           COALESCE(SUM(m.impressions), 0) AS impressions, COALESCE(SUM(m.clicks), 0) AS clicks,
           COALESCE(SUM(m.conversions), 0) AS conversions
    FROM ad_metrics m JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.date BETWEEN ? AND ? AND (? IS NULL OR c.platform = ?)
  `).get(start, end, platform, platform);
  return withDerived(row);
}

// KPI cards: totals for the range, change vs. the previous equal-length period,
// the last day of the range vs. the day before it, and daily series for sparklines.
router.get('/summary', (req, res) => {
  const range = rangeFromQuery(req.query);
  const platform = platformFilter(req.query);
  const prev = previousRange(range);

  const current = totals(range.start, range.end, platform);
  const previous = totals(prev.start, prev.end, platform);
  const lastDay = totals(range.end, range.end, platform);
  const dayBefore = totals(addDays(range.end, -1), addDays(range.end, -1), platform);

  const dailyRows = db.prepare(`
    SELECT m.date, SUM(m.spend) AS spend, SUM(m.clicks) AS clicks, SUM(m.conversions) AS conversions
    FROM ad_metrics m JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.date BETWEEN ? AND ? AND (? IS NULL OR c.platform = ?)
    GROUP BY m.date ORDER BY m.date
  `).all(range.start, range.end, platform, platform);

  const activeCampaigns = db.prepare(`
    SELECT COUNT(*) AS n FROM campaigns WHERE status = 'active' AND (? IS NULL OR platform = ?)
  `).get(platform, platform).n;

  const change = {};
  for (const key of ['spend', 'revenue', 'clicks', 'conversions', 'roas', 'ctr', 'conversion_rate']) {
    change[key] = percentChange(current[key], previous[key]);
  }

  res.json({
    range,
    previous_range: prev,
    current,
    previous,
    change,
    last_day: { date: range.end, ...lastDay, spend_change: percentChange(lastDay.spend, dayBefore.spend) },
    daily: dailyRows,
    active_campaigns: activeCampaigns,
  });
});

// Every bucket start between start and end, so empty periods still show as zero.
function bucketKeys(start, end, granularity) {
  const keys = [];
  let d = parseISODate(start);
  if (granularity === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (granularity === 'month') d.setDate(1);
  const last = parseISODate(end);
  while (d <= last) {
    keys.push(toISODate(d));
    if (granularity === 'day') d.setDate(d.getDate() + 1);
    else if (granularity === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  }
  return keys;
}

// Chart data: one row per time bucket with a value per platform.
router.get('/trend', (req, res) => {
  const range = rangeFromQuery(req.query);
  const metric = TREND_METRICS[req.query.metric] ? req.query.metric : 'spend';
  const granularity = BUCKETS[req.query.granularity] ? req.query.granularity : 'day';

  const rows = db.prepare(`
    SELECT ${BUCKETS[granularity]} AS bucket, c.platform, ${TREND_METRICS[metric]} AS value
    FROM ad_metrics m JOIN campaigns c ON c.id = m.campaign_id
    WHERE m.date BETWEEN ? AND ?
    GROUP BY bucket, c.platform
  `).all(range.start, range.end);

  const byBucket = new Map(
    bucketKeys(range.start, range.end, granularity).map((k) => [k, Object.fromEntries(PLATFORMS.map((p) => [p, 0]))])
  );
  for (const r of rows) {
    if (byBucket.has(r.bucket)) byBucket.get(r.bucket)[r.platform] = r.value;
  }

  res.json({
    range,
    metric,
    granularity,
    platforms: PLATFORMS.map((p) => ({ key: p, label: integrations[p].label })),
    data: [...byBucket].map(([bucket, values]) => ({ bucket, ...values })),
  });
});

// Campaign table and ranking: every campaign with metrics aggregated over the range.
router.get('/campaigns', (req, res) => {
  const range = rangeFromQuery(req.query);
  const platform = platformFilter(req.query);
  const search = (req.query.q || '').trim();
  const sort = SORTABLE.includes(req.query.sort) ? req.query.sort : 'spend';
  const dir = req.query.order === 'asc' ? 1 : -1;
  const limit = Math.min(Number(req.query.limit) || 500, 500);

  const rows = db.prepare(`
    SELECT c.id, c.platform, c.external_id, c.name, c.status,
           COALESCE(SUM(m.spend), 0) AS spend, COALESCE(SUM(m.revenue), 0) AS revenue,
           COALESCE(SUM(m.impressions), 0) AS impressions, COALESCE(SUM(m.clicks), 0) AS clicks,
           COALESCE(SUM(m.conversions), 0) AS conversions
    FROM campaigns c
    LEFT JOIN ad_metrics m ON m.campaign_id = c.id AND m.date BETWEEN ? AND ?
    WHERE (? IS NULL OR c.platform = ?) AND (? = '' OR c.name LIKE '%' || ? || '%')
    GROUP BY c.id
  `).all(range.start, range.end, platform, platform, search, search);

  const result = rows
    .map((r) => ({ ...withDerived(r), platform_label: integrations[r.platform].label }))
    .sort((a, b) => {
      const x = a[sort], y = b[sort];
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir;
    })
    .slice(0, limit);

  res.json({ range, data: result });
});

module.exports = router;
