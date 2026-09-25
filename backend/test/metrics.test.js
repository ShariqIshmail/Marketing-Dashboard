const test = require('node:test');
const assert = require('node:assert/strict');
const { withDerived, percentChange } = require('../utils/metrics');
const { previousRange, rangeFromQuery, addDays } = require('../utils/dates');

test('derived metrics', () => {
  const m = withDerived({ spend: 200, revenue: 800, impressions: 10000, clicks: 250, conversions: 10 });
  assert.equal(m.roas, 4);
  assert.equal(m.roi, 300);
  assert.equal(m.ctr, 2.5);
  assert.equal(m.cpc, 0.8);
  assert.equal(m.cpa, 20);
  assert.equal(m.conversion_rate, 4);
});

test('derived metrics never divide by zero', () => {
  const m = withDerived({ spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 });
  for (const k of ['roas', 'roi', 'ctr', 'cpc', 'cpa', 'conversion_rate']) assert.equal(m[k], 0, k);
});

test('percentChange', () => {
  assert.equal(percentChange(120, 100), 20);
  assert.equal(percentChange(80, 100), -20);
  assert.equal(percentChange(50, 0), null);
});

test('previousRange is the equal-length period right before', () => {
  assert.deepEqual(previousRange({ start: '2026-09-01', end: '2026-09-30' }), { start: '2026-08-02', end: '2026-08-31' });
  assert.deepEqual(previousRange({ start: '2026-03-01', end: '2026-03-01' }), { start: '2026-02-28', end: '2026-02-28' });
});

test('rangeFromQuery defaults, validates and orders dates', () => {
  const r = rangeFromQuery({});
  assert.equal(addDays(r.start, 29), r.end);
  assert.deepEqual(rangeFromQuery({ start: '2026-09-10', end: '2026-09-01' }), { start: '2026-09-01', end: '2026-09-10' });
  assert.deepEqual(rangeFromQuery({ start: 'bad', end: '2026-09-30' }), { start: '2026-09-01', end: '2026-09-30' });
});
