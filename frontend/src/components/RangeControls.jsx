import React from 'react';
import { PRESETS, presetRange } from '../lib.js';

export default function RangeControls({ range, onChange }) {
  const setDate = (key, value) => {
    if (!value) return;
    const next = { ...range, [key]: value, preset: 'custom' };
    if (next.start > next.end) [next.start, next.end] = [next.end, next.start];
    onChange(next);
  };

  return (
    <div className="range-controls">
      <div className="presets">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className={`preset ${range.preset === p.key ? 'active' : ''}`}
            onClick={() => onChange(presetRange(p.key))}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="date-range">
        <input type="date" value={range.start} max={range.end} onChange={(e) => setDate('start', e.target.value)} aria-label="Start date" />
        <span className="tilde">~</span>
        <input type="date" value={range.end} min={range.start} onChange={(e) => setDate('end', e.target.value)} aria-label="End date" />
      </div>
    </div>
  );
}
