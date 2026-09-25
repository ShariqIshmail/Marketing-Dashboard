import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import RangeControls from '../components/RangeControls.jsx';
import PlatformBadge from '../components/PlatformBadge.jsx';
import useAsync from '../useAsync.js';
import { api, fmt, PLATFORMS } from '../lib.js';

const COLUMNS = [
  { key: 'name', label: 'Campaign', align: 'left' },
  { key: 'platform', label: 'Platform', align: 'left', render: (c) => <PlatformBadge platform={c.platform} /> },
  { key: 'status', label: 'Status', align: 'left', render: (c) => <span className={`status status-${c.status}`}>{c.status}</span> },
  { key: 'spend', label: 'Spend', format: fmt.money },
  { key: 'impressions', label: 'Impr.', format: fmt.num },
  { key: 'clicks', label: 'Clicks', format: fmt.num },
  { key: 'ctr', label: 'CTR', format: (n) => fmt.pct(n, 2) },
  { key: 'conversions', label: 'Conv.', format: fmt.num },
  { key: 'cpa', label: 'CPA', format: fmt.money2 },
  { key: 'revenue', label: 'Revenue', format: fmt.money },
  { key: 'roas', label: 'ROAS', format: fmt.roas },
];

export default function CampaignsPage({ range, onRangeChange, search, onSearch }) {
  const [platform, setPlatform] = useState('');
  const [sort, setSort] = useState({ key: 'spend', order: 'desc' });
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, error, loading } = useAsync(
    () => api.campaigns({ start: range.start, end: range.end, platform: platform || undefined, q: debounced || undefined, sort: sort.key, order: sort.order }),
    [range.start, range.end, platform, debounced, sort.key, sort.order]
  );
  const rows = data?.data || [];

  const toggleSort = (key) =>
    setSort((s) => ({ key, order: s.key === key && s.order === 'desc' ? 'asc' : 'desc' }));

  const totals = rows.reduce(
    (t, r) => ({ spend: t.spend + r.spend, revenue: t.revenue + r.revenue, conversions: t.conversions + r.conversions }),
    { spend: 0, revenue: 0, conversions: 0 }
  );

  return (
    <div className="page">
      {error && <div className="alert error">Could not load campaigns: {error}</div>}

      <section className="card panel">
        <div className="panel-head">
          <div className="filters">
            <h2 className="page-title">Campaigns</h2>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
              <option value="">All platforms</option>
              {Object.entries(PLATFORMS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
            </select>
            {search && (
              <button className="chip" onClick={() => onSearch('')}>
                “{search}” <X size={14} />
              </button>
            )}
          </div>
          <RangeControls range={range} onChange={onRangeChange} />
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} className={col.align === 'left' ? 'left' : ''}>
                    <button className="th-button" onClick={() => toggleSort(col.key)}>
                      {col.label}
                      {sort.key === col.key && (sort.order === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className={col.align === 'left' ? 'left' : 'num'}>
                      {col.render ? col.render(c) : col.format ? col.format(c[col.key]) : c[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={COLUMNS.length} className="empty">No campaigns match.</td></tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td className="left" colSpan={3}>{rows.length} campaigns</td>
                  <td className="num">{fmt.money(totals.spend)}</td>
                  <td colSpan={3} />
                  <td className="num">{fmt.num(totals.conversions)}</td>
                  <td className="num">{fmt.money2(totals.conversions ? totals.spend / totals.conversions : 0)}</td>
                  <td className="num">{fmt.money(totals.revenue)}</td>
                  <td className="num">{fmt.roas(totals.spend ? totals.revenue / totals.spend : 0)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
