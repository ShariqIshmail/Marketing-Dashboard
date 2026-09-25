import axios from 'axios';

// ---- API ----
export const api = {
  summary: (range) => axios.get('/api/summary', { params: range }).then((r) => r.data),
  trend: (params) => axios.get('/api/trend', { params }).then((r) => r.data),
  campaigns: (params) => axios.get('/api/campaigns', { params }).then((r) => r.data),
  integrations: () => axios.get('/api/integrations').then((r) => r.data),
  sync: (platform) => axios.post(`/api/integrations/${platform}/sync`).then((r) => r.data),
};

export const errorMessage = (err) => err.response?.data?.error || err.message;

// ---- Platforms (colors validated as a CVD-safe categorical set) ----
export const PLATFORMS = {
  google_ads: { label: 'Google Ads', short: 'Google', color: '#2a78d6' },
  meta_ads: { label: 'Meta Ads', short: 'Meta', color: '#eb6834' },
  linkedin_ads: { label: 'LinkedIn Ads', short: 'LinkedIn', color: '#1baf7a' },
};

// ---- Formatting ----
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export const fmt = {
  money: (n) => `$${whole.format(n || 0)}`,
  money2: (n) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  moneyCompact: (n) => `$${compact.format(n || 0)}`,
  num: (n) => whole.format(n || 0),
  compact: (n) => compact.format(n || 0),
  pct: (n, digits = 1) => `${(n || 0).toFixed(digits)}%`,
  roas: (n) => `${(n || 0).toFixed(2)}x`,
};

export const METRICS = {
  spend: { label: 'Spend', format: fmt.money, axis: fmt.moneyCompact },
  revenue: { label: 'Revenue', format: fmt.money, axis: fmt.moneyCompact },
  conversions: { label: 'Conversions', format: fmt.num, axis: fmt.compact },
};

// ---- Dates ('YYYY-MM-DD', local time) ----
const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseIso = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const daysInRange = ({ start, end }) => Math.round((parseIso(end) - parseIso(start)) / 86400000) + 1;

export const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
];

export function presetRange(key, now = new Date()) {
  const end = iso(now);
  const d = new Date(now);
  if (key === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  if (key === 'month') d.setDate(1);
  if (key === 'year') d.setMonth(0, 1);
  return { preset: key, start: iso(d), end };
}

// Pick a bucket size that keeps the bar chart readable.
export function granularityFor(range) {
  const days = daysInRange(range);
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function bucketLabel(bucket, granularity) {
  const d = parseIso(bucket);
  if (granularity === 'month') return MONTHS[d.getMonth()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function shortDate(s) {
  const d = parseIso(s);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function timeAgo(sqlTimestamp) {
  if (!sqlTimestamp) return 'Never';
  const then = new Date(sqlTimestamp.replace(' ', 'T') + 'Z'); // SQLite CURRENT_TIMESTAMP is UTC
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return then.toLocaleDateString();
}
