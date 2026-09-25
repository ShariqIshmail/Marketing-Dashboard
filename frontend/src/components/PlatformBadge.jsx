import React from 'react';
import { PLATFORMS } from '../lib.js';

export default function PlatformBadge({ platform }) {
  const p = PLATFORMS[platform];
  return (
    <span className="platform-badge">
      <span className="swatch" style={{ background: p?.color }} />
      {p?.short || platform}
    </span>
  );
}
