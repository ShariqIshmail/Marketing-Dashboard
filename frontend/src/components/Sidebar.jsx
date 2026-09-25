import React from 'react';
import { LayoutDashboard, Megaphone, PlugZap } from 'lucide-react';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'integrations', label: 'Integrations', icon: PlugZap },
];

export default function Sidebar({ page, onNavigate, collapsed }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#1677ff" />
          <path d="M8 22l6-7 4 4 6-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {!collapsed && <span>AdPulse</span>}
      </div>
      <nav>
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`nav-item ${page === key ? 'active' : ''}`}
            onClick={() => onNavigate(key)}
            title={collapsed ? label : undefined}
          >
            <Icon size={19} strokeWidth={1.75} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
