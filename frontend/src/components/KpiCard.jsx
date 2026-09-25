import React from 'react';
import { Info } from 'lucide-react';

export function KpiCard({ title, info, value, children, footer, centered }) {
  return (
    <div className={`card kpi ${centered ? 'kpi-centered' : ''}`}>
      <div className="kpi-head">
        <span className="kpi-title">{title}</span>
        {info && (
          <span className="kpi-info" title={info}>
            <Info size={16} strokeWidth={1.5} />
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-body">{children}</div>
      {footer && <div className="kpi-footer">{footer}</div>}
    </div>
  );
}

// "Label 13% ▲". For costs, up is shown red and down green.
export function Delta({ label, value, upIsGood = true }) {
  if (value === null || value === undefined) {
    return (
      <div className="delta">
        <span className="delta-label">{label}</span>
        <span className="delta-value muted">n/a</span>
      </div>
    );
  }
  const up = value >= 0;
  const good = up === upIsGood;
  return (
    <div className="delta">
      <span className="delta-label">{label}</span>
      <span className="delta-value">{Math.abs(value).toFixed(0)}%</span>
      <span className={`delta-arrow ${up ? 'up' : 'down'} ${good ? 'good' : 'bad'}`} aria-label={up ? 'up' : 'down'} />
    </div>
  );
}
