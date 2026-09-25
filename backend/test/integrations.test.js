// Connector normalizers checked against sample API responses (shapes taken from each API's docs).
const test = require('node:test');
const assert = require('node:assert/strict');
const googleAds = require('../integrations/googleAds');
const metaAds = require('../integrations/metaAds');
const linkedinAds = require('../integrations/linkedinAds');

test('Google Ads: searchStream batches -> daily rows, micros converted to currency', () => {
  const batches = [{
    results: [{
      campaign: { resourceName: 'customers/123/campaigns/987', id: '987', name: 'Search - Brand', status: 'ENABLED' },
      metrics: { costMicros: '12345678', impressions: '4200', clicks: '310', conversions: 12.5, conversionsValue: 1530.2 },
      segments: { date: '2026-09-01' },
    }],
  }, {
    results: [{
      campaign: { id: '555', name: 'Paused one', status: 'PAUSED' },
      metrics: {}, // Google omits zero-valued metrics
      segments: { date: '2026-09-02' },
    }],
  }];

  assert.deepEqual(googleAds.normalize(batches), [
    { external_campaign_id: '987', campaign_name: 'Search - Brand', status: 'active', date: '2026-09-01',
      spend: 12.345678, impressions: 4200, clicks: 310, conversions: 12.5, revenue: 1530.2 },
    { external_campaign_id: '555', campaign_name: 'Paused one', status: 'paused', date: '2026-09-02',
      spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  ]);
  assert.deepEqual(googleAds.normalize(undefined), []);
});

test('Meta Ads: insights -> daily rows, conversions from the first matching action type', () => {
  const insights = [{
    campaign_id: '2385', campaign_name: 'Prospecting', date_start: '2026-09-01', date_stop: '2026-09-01',
    spend: '250.40', impressions: '51000', clicks: '640',
    actions: [
      { action_type: 'link_click', value: '640' },
      { action_type: 'purchase', value: '9' },
      { action_type: 'omni_purchase', value: '11' },
    ],
    action_values: [{ action_type: 'omni_purchase', value: '812.50' }, { action_type: 'purchase', value: '700' }],
  }, {
    campaign_id: '2386', campaign_name: 'No sales', date_start: '2026-09-01', spend: '10', impressions: '900', clicks: '4',
  }];

  const rows = metaAds.normalize(insights, ['omni_purchase', 'purchase']);
  assert.equal(rows[0].conversions, 11);
  assert.equal(rows[0].revenue, 812.5);
  assert.equal(rows[0].spend, 250.4);
  assert.equal(rows[0].date, '2026-09-01');
  assert.equal(rows[1].conversions, 0);
  assert.equal(rows[1].revenue, 0);
});

test('LinkedIn Ads: adAnalytics elements -> daily rows named from the campaign list', () => {
  const elements = [{
    pivotValues: ['urn:li:sponsoredCampaign:1001'],
    dateRange: { start: { year: 2026, month: 9, day: 3 }, end: { year: 2026, month: 9, day: 3 } },
    costInLocalCurrency: '180.25', impressions: 12000, clicks: 45,
    externalWebsiteConversions: 3, conversionValueInLocalCurrency: '900',
  }, {
    pivotValues: ['urn:li:sponsoredCampaign:2002'],
    dateRange: { start: { year: 2026, month: 9, day: 3 }, end: { year: 2026, month: 9, day: 3 } },
    costInLocalCurrency: '5', impressions: 100, clicks: 1,
  }];
  const campaigns = [{ id: 1001, name: 'Lead Gen - Decision Makers', status: 'PAUSED' }];

  const rows = linkedinAds.normalize(elements, campaigns);
  assert.deepEqual(rows[0], {
    external_campaign_id: '1001', campaign_name: 'Lead Gen - Decision Makers', status: 'paused', date: '2026-09-03',
    spend: 180.25, impressions: 12000, clicks: 45, conversions: 3, revenue: 900,
  });
  assert.equal(rows[1].campaign_name, 'Campaign 2002'); // unknown campaign still gets saved
  assert.equal(rows[1].conversions, 0);
});
