// Google Ads connector (REST API, googleAds:searchStream).
// Docs: https://developers.google.com/google-ads/api/rest/overview
const axios = require('axios');

const ENV_KEYS = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
];
const OPTIONAL_ENV_KEYS = ['GOOGLE_ADS_LOGIN_CUSTOMER_ID', 'GOOGLE_ADS_API_VERSION'];

const STATUS_MAP = { ENABLED: 'active', PAUSED: 'paused', REMOVED: 'removed' };

const isConfigured = () => ENV_KEYS.every((k) => process.env[k]);
const digits = (s) => String(s || '').replace(/\D/g, '');

// Convert searchStream batches into normalized daily rows.
function normalize(batches) {
  const rows = [];
  for (const batch of batches || []) {
    for (const r of batch.results || []) {
      const m = r.metrics || {};
      rows.push({
        external_campaign_id: String(r.campaign.id),
        campaign_name: r.campaign.name,
        status: STATUS_MAP[r.campaign.status] || 'active',
        date: r.segments.date,
        spend: Number(m.costMicros || 0) / 1e6,
        impressions: Number(m.impressions || 0),
        clicks: Number(m.clicks || 0),
        conversions: Number(m.conversions || 0),
        revenue: Number(m.conversionsValue || 0),
      });
    }
  }
  return rows;
}

async function getAccessToken() {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }));
  return data.access_token;
}

async function fetchDaily(start, end) {
  const version = process.env.GOOGLE_ADS_API_VERSION || 'v21';
  const customerId = digits(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const headers = {
    Authorization: `Bearer ${await getAccessToken()}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  };
  if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers['login-customer-id'] = digits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  }

  const query = `
    SELECT campaign.id, campaign.name, campaign.status, segments.date,
           metrics.cost_micros, metrics.impressions, metrics.clicks,
           metrics.conversions, metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${start}' AND '${end}'`;

  const { data } = await axios.post(
    `https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:searchStream`,
    { query },
    { headers }
  );
  return normalize(data);
}

module.exports = { label: 'Google Ads', ENV_KEYS, OPTIONAL_ENV_KEYS, isConfigured, fetchDaily, normalize };
