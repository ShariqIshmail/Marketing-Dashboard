import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PLATFORMS, bucketLabel } from '../lib.js';

const AXIS = { fontSize: 12, fill: '#6b6f76' };

function ChartTooltip({ active, payload, label, format, granularity }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="chart-tooltip">
      <div className="tt-title">
        {granularity === 'week' ? `Week of ${bucketLabel(label, 'day')}` : bucketLabel(label, granularity)}
      </div>
      {payload.map((p) => (
        <div className="tt-row" key={p.dataKey}>
          <span className="swatch" style={{ background: p.color }} />
          <span>{PLATFORMS[p.dataKey].short}</span>
          <span className="tt-value">{format(p.value)}</span>
        </div>
      ))}
      <div className="tt-row tt-total">
        <span />
        <span>Total</span>
        <span className="tt-value">{format(total)}</span>
      </div>
    </div>
  );
}

// Grouped columns: one group per time bucket, one bar per platform.
export default function TrendChart({ data, granularity, format, axisFormat }) {
  const platforms = Object.keys(PLATFORMS);

  return (
    <div className="trend-chart">
      <div className="legend">
        {platforms.map((p) => (
          <span key={p} className="legend-item">
            <span className="swatch" style={{ background: PLATFORMS[p].color }} />
            {PLATFORMS[p].label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eceef1" />
          <XAxis
            dataKey="bucket"
            tickFormatter={(b) => bucketLabel(b, granularity)}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: '#d9dce1' }}
            minTickGap={12}
          />
          <YAxis tickFormatter={axisFormat} tick={AXIS} tickLine={false} axisLine={false} width={56} />
          <Tooltip
            cursor={{ fill: 'rgba(22, 119, 255, 0.06)' }}
            content={<ChartTooltip format={format} granularity={granularity} />}
          />
          {platforms.map((p) => (
            <Bar key={p} dataKey={p} fill={PLATFORMS[p].color} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
