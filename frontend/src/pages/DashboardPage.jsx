import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { KpiCard, Delta } from '../components/KpiCard.jsx';
import RangeControls from '../components/RangeControls.jsx';
import TrendChart from '../components/TrendChart.jsx';
import RankingList from '../components/RankingList.jsx';
import useAsync from '../useAsync.js';
import { api, fmt, METRICS, granularityFor, iso, shortDate } from '../lib.js';

const ACCENT = '#1677ff';

function SparkTooltip({ active, payload, format }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip small">
      <div className="tt-title">{shortDate(row.date)}</div>
      <div className="tt-value">{format(payload[0].value)}</div>
    </div>
  );
}

export default function DashboardPage({ range, onRangeChange }) {
  const [metric, setMetric] = useState('spend');
  const granularity = granularityFor(range);
  const rangeParams = { start: range.start, end: range.end };

  const summary = useAsync(() => api.summary(rangeParams), [range.start, range.end]);
  const trend = useAsync(
    () => api.trend({ ...rangeParams, metric, granularity }),
    [range.start, range.end, metric, granularity]
  );
  const top = useAsync(
    () => api.campaigns({ ...rangeParams, sort: metric, limit: 7 }),
    [range.start, range.end, metric]
  );

  const s = summary.data;
  const error = summary.error || trend.error || top.error;
  const lastDayLabel = s && s.last_day.date === iso(new Date()) ? "Today's spend" : `Spend on ${s ? shortDate(s.last_day.date) : ''}`;
  const recentDaily = s ? s.daily.slice(-14) : [];

  return (
    <div className="page">
      {error && <div className="alert error">Could not load data: {error}</div>}

      <section className="kpi-grid">
        <KpiCard
          title="Total spend"
          info="Ad spend across all platforms for the selected dates."
          value={s ? fmt.money(s.current.spend) : '–'}
          footer={s && <>{lastDayLabel} <strong>{fmt.money(s.last_day.spend)}</strong></>}
        >
          {s && (
            <>
              <Delta label="vs prev. period" value={s.change.spend} upIsGood={false} />
              <Delta label="Day ratio" value={s.last_day.spend_change} upIsGood={false} />
            </>
          )}
        </KpiCard>

        <KpiCard
          title="Clicks"
          info="Total clicks, with daily clicks over the selected dates."
          value={s ? fmt.num(s.current.clicks) : '–'}
          footer={s && <>CTR <strong>{fmt.pct(s.current.ctr, 2)}</strong></>}
        >
          <ResponsiveContainer width="100%" height={64}>
            <AreaChart data={s?.daily || []} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip content={<SparkTooltip format={fmt.num} />} cursor={{ stroke: '#d9dce1' }} />
              <Area baseValue="dataMin" type="monotone" dataKey="clicks" stroke={ACCENT} strokeWidth={2} fill={ACCENT} fillOpacity={0.1} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </KpiCard>

        <KpiCard
          title="Conversions"
          info="Conversions reported by the ad platforms. Bars show the last 14 days of the range."
          value={s ? fmt.num(s.current.conversions) : '–'}
          footer={s && <>Conversion rate <strong>{fmt.pct(s.current.conversion_rate)}</strong></>}
        >
          <ResponsiveContainer width="100%" height={64}>
            <BarChart data={recentDaily} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="25%">
              <Tooltip content={<SparkTooltip format={fmt.num} />} cursor={{ fill: 'rgba(22, 119, 255, 0.06)' }} />
              <Bar dataKey="conversions" fill={ACCENT} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </KpiCard>

        <KpiCard
          centered
          title="ROAS"
          info="Return on ad spend: revenue divided by spend."
          value={s ? fmt.roas(s.current.roas) : '–'}
        >
          {s && (
            <div className="roas-caption">
              Revenue {fmt.moneyCompact(s.current.revenue)}
              <Delta label="vs prev. period" value={s.change.roas} />
            </div>
          )}
        </KpiCard>
      </section>

      <section className="card panel">
        <div className="panel-head">
          <div className="tabs" role="tablist">
            {Object.entries(METRICS).map(([key, m]) => (
              <button
                key={key}
                role="tab"
                aria-selected={metric === key}
                className={`tab ${metric === key ? 'active' : ''}`}
                onClick={() => setMetric(key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <RangeControls range={range} onChange={onRangeChange} />
        </div>

        <div className="panel-body">
          <div className="panel-chart">
            <h3 className="section-title">{METRICS[metric].label} by platform</h3>
            {trend.data && (
              <TrendChart
                data={trend.data.data}
                granularity={trend.data.granularity}
                format={METRICS[metric].format}
                axisFormat={METRICS[metric].axis}
              />
            )}
          </div>
          <RankingList
            title="Top campaigns"
            format={METRICS[metric].format}
            items={(top.data?.data || []).map((c) => ({ id: c.id, name: c.name, platform: c.platform, value: c[metric] }))}
          />
        </div>
      </section>
    </div>
  );
}
