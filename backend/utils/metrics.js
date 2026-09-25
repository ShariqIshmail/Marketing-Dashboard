// Derived ad metrics. All ratios return 0 instead of dividing by zero.

const ratio = (a, b) => (b > 0 ? a / b : 0);

function withDerived(row) {
  const spend = Number(row.spend) || 0;
  const revenue = Number(row.revenue) || 0;
  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  const conversions = Number(row.conversions) || 0;

  return {
    ...row,
    spend,
    revenue,
    impressions,
    clicks,
    conversions,
    roas: ratio(revenue, spend),
    roi: ratio(revenue - spend, spend) * 100,
    ctr: ratio(clicks, impressions) * 100,
    cpc: ratio(spend, clicks),
    cpa: ratio(spend, conversions),
    conversion_rate: ratio(conversions, clicks) * 100,
  };
}

// Percent change from previous to current; null when there is no baseline.
function percentChange(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

module.exports = { withDerived, percentChange };
