import React from 'react';
import PlatformBadge from './PlatformBadge.jsx';

export default function RankingList({ title, items, format }) {
  return (
    <div className="ranking">
      <h3 className="section-title">{title}</h3>
      {items.length === 0 ? (
        <p className="empty">No campaigns in this range.</p>
      ) : (
        <ol>
          {items.map((item, i) => (
            <li key={item.id}>
              <span className={`rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
              <span className="rank-name" title={item.name}>
                {item.name}
                <PlatformBadge platform={item.platform} />
              </span>
              <span className="rank-value">{format(item.value)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
