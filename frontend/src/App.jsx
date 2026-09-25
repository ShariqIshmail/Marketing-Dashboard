import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CampaignsPage from './pages/CampaignsPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import { api, presetRange } from './lib.js';

const USER = { name: 'Ismail Shariq' };

const PAGES = ['dashboard', 'campaigns', 'integrations'];
const pageFromHash = () => {
  const p = window.location.hash.slice(1);
  return PAGES.includes(p) ? p : 'dashboard';
};

export default function App() {
  const [page, setPageState] = useState(pageFromHash);
  const [collapsed, setCollapsed] = useState(false);
  const [range, setRange] = useState(() => presetRange('month'));
  const [search, setSearch] = useState('');
  const [failedSyncs, setFailedSyncs] = useState(0);

  const refreshSyncStatus = useCallback(() => {
    api.integrations().then((d) => setFailedSyncs(d.failed_count)).catch(() => {});
  }, []);

  useEffect(refreshSyncStatus, [refreshSyncStatus]);

  // Keep the page in the URL hash so refresh and back/forward work.
  useEffect(() => {
    const onHash = () => setPageState(pageFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const setPage = (p) => { window.location.hash = p; };

  const submitSearch = () => setPage('campaigns');

  return (
    <div className={`app ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar page={page} onNavigate={setPage} collapsed={collapsed} />
      <div className="main">
        <Topbar
          user={USER}
          search={search}
          onSearch={setSearch}
          onSubmitSearch={submitSearch}
          failedSyncs={failedSyncs}
          onBell={() => setPage('integrations')}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main className="content">
          {page === 'dashboard' && <DashboardPage range={range} onRangeChange={setRange} />}
          {page === 'campaigns' && (
            <CampaignsPage range={range} onRangeChange={setRange} search={search} onSearch={setSearch} />
          )}
          {page === 'integrations' && <IntegrationsPage onSynced={refreshSyncStatus} />}
        </main>
      </div>
    </div>
  );
}
