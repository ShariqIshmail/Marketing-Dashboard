// LinkedIn Ads connector (Marketing API adAnalytics, versioned REST).
// Docs: https://learn.microsoft.com/linkedin/marketing/integrations/ads-reporting/ads-reporting
const axios = require('axios');

const ENV_KEYS = ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_AD_ACCOUNT_ID'];
const OPTIONAL_ENV_KEYS = ['LINKEDIN_API_VERSION'];

const STATUS_MAP = { ACTIVE: 'active', PAUSED: 'paused', ARCHIVED: 'removed', CANCELED: 'removed', DRAFT: 'paused', COMPLETED: 'paused' };

const isConfigured = () => ENV_KEYS.every((k) => process.env[k]);

const pad = (n) => String(n).padStart(2, '0');
const dateFromParts = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`;
const idFromUrn = (urn) => String(urn).split(':').pop();

// Rest.li date literal, e.g. (year:2026,month:9,day:1)
function restliDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return `(year:${year},month:${month},day:${day})`;
}

// campaigns: [{ id, name, status }] from the adCampaigns search, used to name rows.
function normalize(elements, campaigns = []) {
  const byId = new Map(campaigns.map((c) => [String(c.id), c]));
  return (elements || []).map((e) => {
    const id = idFromUrn(e.pivotValues[0]);
    const campaign = byId.get(id);
    return {
      external_campaign_id: id,
      campaign_name: campaign?.name || `Campaign ${id}`,
      status: STATUS_MAP[campaign?.status] || 'active',
      date: dateFromParts(e.dateRange.start),
      spend: Number(e.costInLocalCurrency || 0),
      impressions: Number(e.impressions || 0),
      clicks: Number(e.clicks || 0),
      conversions: Number(e.externalWebsiteConversions || 0),
      revenue: Number(e.conversionValueInLocalCurrency || 0),
    };
  });
}

function client() {
  return axios.create({
    baseURL: 'https://api.linkedin.com/rest',
    headers: {
      Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
      'LinkedIn-Version': process.env.LINKEDIN_API_VERSION || '202509',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });
}

async function fetchCampaigns(api, account) {
  const campaigns = [];
  let pageToken = '';
  do {
    const { data } = await api.get(
      `/adAccounts/${account}/adCampaigns?q=search&pageSize=1000${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    );
    campaigns.push(...(data.elements || []));
    pageToken = data.metadata?.nextPageToken || '';
  } while (pageToken);
  return campaigns;
}

async function fetchDaily(start, end) {
  const api = client();
  const account = idFromUrn(process.env.LINKEDIN_AD_ACCOUNT_ID);
  const campaigns = await fetchCampaigns(api, account);

  // Rest.li syntax: parentheses stay literal, the URN inside List() is encoded.
  const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${account}`);
  const fields = 'dateRange,pivotValues,costInLocalCurrency,impressions,clicks,externalWebsiteConversions,conversionValueInLocalCurrency';
  const { data } = await api.get(
    `/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY` +
      `&dateRange=(start:${restliDate(start)},end:${restliDate(end)})` +
      `&accounts=List(${accountUrn})&fields=${fields}`
  );
  return normalize(data.elements, campaigns);
}

module.exports = { label: 'LinkedIn Ads', ENV_KEYS, OPTIONAL_ENV_KEYS, isConfigured, fetchDaily, normalize };
