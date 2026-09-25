import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, CircleDashed } from 'lucide-react';
import useAsync from '../useAsync.js';
import { api, errorMessage, PLATFORMS, timeAgo } from '../lib.js';

const DOCS = {
  google_ads: 'https://developers.google.com/google-ads/api/docs/get-started/introduction',
  meta_ads: 'https://developers.facebook.com/docs/marketing-api/get-started',
  linkedin_ads: 'https://learn.microsoft.com/linkedin/marketing/quick-start',
};

function StatusLine({ p }) {
  if (!p.configured) {
    return <span className="conn conn-off"><CircleDashed size={16} /> Not configured</span>;
  }
  if (p.last_run?.status === 'failed') {
    return <span className="conn conn-bad"><AlertTriangle size={16} /> Last sync failed</span>;
  }
  return <span className="conn conn-ok"><CheckCircle2 size={16} /> Connected</span>;
}

function PlatformCard({ p, onSynced }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const sync = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const r = await api.sync(p.key);
      setMessage({ ok: true, text: `Synced ${r.rows_synced} daily rows (${r.start} to ${r.end}).` });
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
      onSynced();
    }
  };

  return (
    <div className="card integration">
      <div className="integration-head">
        <span className="platform-mark" style={{ background: PLATFORMS[p.key].color }}>{p.label[0]}</span>
        <div>
          <h3>{p.label}</h3>
          <StatusLine p={p} />
        </div>
      </div>

      <dl className="integration-stats">
        <div><dt>Last successful sync</dt><dd>{timeAgo(p.last_success?.finished_at)}</dd></div>
        <div><dt>Rows in last sync</dt><dd>{p.last_success ? p.last_success.rows_synced : '–'}</dd></div>
        <div><dt>Campaigns stored</dt><dd>{p.campaigns}</dd></div>
      </dl>

      {p.last_run?.status === 'failed' && <p className="alert error small">{p.last_run.error}</p>}
      {message && <p className={`alert small ${message.ok ? 'success' : 'error'}`}>{message.text}</p>}

      {!p.configured && (
        <div className="env-help">
          <p>Add these to <code>.env</code> in the project folder, then restart:</p>
          <ul>{p.missing_env_keys.map((k) => <li key={k}><code>{k}</code></li>)}</ul>
          <a href={DOCS[p.key]} target="_blank" rel="noreferrer">How to get API access</a>
        </div>
      )}

      <button className="button primary" onClick={sync} disabled={busy || !p.configured}>
        <RefreshCw size={15} className={busy ? 'spin' : ''} />
        {busy ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  );
}

export default function IntegrationsPage({ onSynced }) {
  const [version, setVersion] = useState(0);
  const { data, error } = useAsync(() => api.integrations(), [version]);

  const handleSynced = () => {
    setVersion((v) => v + 1);
    onSynced();
  };

  return (
    <div className="page">
      <h2 className="page-title">Integrations</h2>
      <p className="page-sub">
        Data syncs automatically on a schedule (every 6 hours by default) and re-pulls the last 30 days each time
        so late conversions are counted.
      </p>
      {error && <div className="alert error">Could not load integrations: {error}</div>}
      <div className="integration-grid">
        {data?.platforms.map((p) => <PlatformCard key={p.key} p={p} onSynced={handleSynced} />)}
      </div>
    </div>
  );
}
