// Sample data so the dashboard has something to show before APIs are connected.
//   npm run seed            -> wipe all data, then insert a year of sample campaigns
//   npm run seed -- --clear -> wipe all data only (do this before connecting real accounts)
const { db } = require('../db');
const { saveRows } = require('../services/store');
const { toISODate, addDays, parseISODate } = require('../utils/dates');

const DAYS = 365;

// Deterministic PRNG so every seed produces the same numbers.
let state = 20260924;
const rand = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);
const jitter = (spread) => 1 + (rand() * 2 - 1) * spread;

const PROFILES = {
  google_ads: { cpc: 1.8, ctr: 0.045, cvr: 0.05, aov: 85, weekend: 0.85 },
  meta_ads: { cpc: 0.9, ctr: 0.014, cvr: 0.028, aov: 70, weekend: 1.15 },
  linkedin_ads: { cpc: 6.5, ctr: 0.006, cvr: 0.035, aov: 260, weekend: 0.45 },
};

// [platform, name, daily budget, days ago started, days ago paused (0 = still running)]
const CAMPAIGNS = [
  ['google_ads', 'Search - Brand', 120, 365, 0],
  ['google_ads', 'Search - Competitors', 180, 300, 0],
  ['google_ads', 'Performance Max - All Products', 320, 240, 0],
  ['google_ads', 'YouTube - Awareness Q2', 150, 200, 110],
  ['meta_ads', 'Prospecting - Lookalike 1%', 260, 365, 0],
  ['meta_ads', 'Retargeting - Cart Abandoners', 90, 330, 0],
  ['meta_ads', 'Instagram Reels - Summer Sale', 210, 120, 60],
  ['meta_ads', 'Advantage+ Shopping', 300, 90, 0],
  ['linkedin_ads', 'Lead Gen - Decision Makers', 200, 280, 0],
  ['linkedin_ads', 'Sponsored Content - Webinar', 110, 150, 0],
  ['linkedin_ads', 'Conversation Ads - Demo Offer', 80, 100, 30],
  ['linkedin_ads', 'Retargeting - Site Visitors', 60, 60, 0],
];

function clear() {
  db.exec('DELETE FROM ad_metrics; DELETE FROM campaigns; DELETE FROM sync_runs;');
}

function seed() {
  const today = toISODate(new Date());
  let total = 0;

  CAMPAIGNS.forEach(([platform, name, budget, startedAgo, pausedAgo], i) => {
    const p = PROFILES[platform];
    const quality = jitter(0.25); // some campaigns just perform better
    const rows = [];

    for (let ago = Math.min(startedAgo, DAYS - 1); ago >= pausedAgo; ago--) {
      const date = addDays(today, -ago);
      const dow = parseISODate(date).getDay();
      const weekend = dow === 0 || dow === 6 ? p.weekend : 1;
      const growth = 0.75 + 0.5 * (1 - ago / DAYS); // spend ramps up over the year
      const q4 = [10, 11].includes(parseISODate(date).getMonth()) ? 1.3 : 1;

      const spend = budget * weekend * growth * q4 * jitter(0.2);
      const clicks = Math.round(spend / (p.cpc * jitter(0.15)));
      const impressions = Math.round(clicks / (p.ctr * jitter(0.2)));
      const conversions = Math.round(clicks * p.cvr * quality * jitter(0.35));
      const revenue = conversions * p.aov * jitter(0.25);

      rows.push({
        external_campaign_id: `sample-${i + 1}`,
        campaign_name: name,
        status: pausedAgo > 0 ? 'paused' : 'active',
        date,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
      });
    }
    total += saveRows(platform, rows);
  });

  return total;
}

clear();
if (process.argv.includes('--clear')) {
  console.log('All campaign and metric data cleared.');
} else {
  const n = seed();
  console.log(`Seeded ${CAMPAIGNS.length} sample campaigns with ${n} daily metric rows.`);
}
