// Meta (Facebook / Instagram) Ads connector (Graph API insights).
// Docs: https://developers.facebook.com/docs/marketing-api/insights
const axios = require('axios');

const ENV_KEYS = ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'];
const OPTIONAL_ENV_KEYS = ['META_API_VERSION', 'META_CONVERSION_ACTIONS'];

const DEFAULT_CONVERSION_ACTIONS = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];

const isConfigured = () => ENV_KEYS.every((k) => process.env[k]);

function conversionActions() {
  const custom = process.env.META_CONVERSION_ACTIONS;
  return custom ? custom.split(',').map((s) => s.trim()).filter(Boolean) : DEFAULT_CONVERSION_ACTIONS;
}

// Meta reports the same purchase under several action types; take the first one present.
function pickAction(list, types) {
  for (const type of types) {
    const hit = (list || []).find((a) => a.action_type === type);
    if (hit) return Number(hit.value || 0);
  }
  return 0;
}

function normalize(insights, types = conversionActions()) {
  return (insights || []).map((r) => ({
    external_campaign_id: String(r.campaign_id),
    campaign_name: r.campaign_name,
    status: 'active',
    date: r.date_start,
    spend: Number(r.spend || 0),
    impressions: Number(r.impressions || 0),
    clicks: Number(r.clicks || 0),
    conversions: pickAction(r.actions, types),
    revenue: pickAction(r.action_values, types),
  }));
}

async function fetchDaily(start, end) {
  const version = process.env.META_API_VERSION || 'v21.0';
  const account = String(process.env.META_AD_ACCOUNT_ID).replace(/^act_/, '');

  let url = `https://graph.facebook.com/${version}/act_${account}/insights`;
  let params = {
    access_token: process.env.META_ACCESS_TOKEN,
    level: 'campaign',
    time_increment: 1,
    time_range: JSON.stringify({ since: start, until: end }),
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions,action_values',
    limit: 500,
  };

  const all = [];
  while (url) {
    const { data } = await axios.get(url, { params });
    all.push(...(data.data || []));
    url = data.paging?.next || null; // "next" already carries every query param
    params = undefined;
  }
  return normalize(all);
}

module.exports = { label: 'Meta Ads', ENV_KEYS, OPTIONAL_ENV_KEYS, isConfigured, fetchDaily, normalize, pickAction };
