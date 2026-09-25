// Date helpers working on 'YYYY-MM-DD' strings in local time.

const pad = (n) => String(n).padStart(2, '0');

function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(s, n) {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function daysBetween(start, end) {
  return Math.round((parseISODate(end) - parseISODate(start)) / 86400000);
}

function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISODate(s));
}

// Read ?start=&end= from a request, defaulting to the last 30 days.
function rangeFromQuery(query) {
  const today = toISODate(new Date());
  const end = isISODate(query.end) ? query.end : today;
  const start = isISODate(query.start) ? query.start : addDays(end, -29);
  return start <= end ? { start, end } : { start: end, end: start };
}

// The equal-length period immediately before [start, end].
function previousRange({ start, end }) {
  const len = daysBetween(start, end) + 1;
  return { start: addDays(start, -len), end: addDays(start, -1) };
}

module.exports = { toISODate, parseISODate, addDays, daysBetween, isISODate, rangeFromQuery, previousRange };
