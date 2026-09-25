import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

export default function Topbar({ user, search, onSearch, onSubmitSearch, failedSyncs, onBell, onToggleSidebar }) {
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2);

  return (
    <header className="topbar">
      <button className="icon-button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <Menu size={22} strokeWidth={1.75} />
      </button>

      <div className="topbar-right">
        <form className="search" onSubmit={(e) => { e.preventDefault(); onSubmitSearch(); }}>
          <Search size={17} strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Search campaigns"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </form>

        <button
          className="icon-button bell"
          onClick={onBell}
          aria-label={failedSyncs ? `${failedSyncs} failed syncs` : 'Notifications'}
          title={failedSyncs ? `${failedSyncs} platform sync(s) failed` : 'No sync problems'}
        >
          <Bell size={20} strokeWidth={1.75} />
          {failedSyncs > 0 && <span className="badge-count">{failedSyncs}</span>}
        </button>

        <div className="user">
          <span className="avatar">{initials}</span>
          <span className="user-name">{user.name.split(' ')[0]}</span>
        </div>
      </div>
    </header>
  );
}
