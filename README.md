# AdPulse – Paid Ads Dashboard

One dashboard for your **Google Ads, Meta Ads and LinkedIn Ads** performance. Data is pulled from each platform's API on a schedule and stored in a local SQLite file, so no database server is needed.

- **Dashboard**: spend, clicks, conversions and ROAS cards with period-over-period changes, a spend / revenue / conversions chart split by platform, and a top-campaigns ranking
- **Campaigns**: a sortable table of every campaign (spend, impressions, clicks, CTR, conversions, CPA, revenue, ROAS), filterable by platform, date range and search
- **Integrations**: connection status per platform, last sync time, and a "Sync now" button

## Quick start

Requires **Node.js 22.13 or newer** (nothing else).

**Easiest:** double-click `START.bat`. It installs everything on first run, loads sample data, and opens the dashboard.

**Or from a terminal** in this folder:

```powershell
npm run setup   # install dependencies (first time only)
npm run seed    # load a year of sample campaigns (optional)
npm run dev     # start everything
```

Then open **http://localhost:5173**. Stop it with `Ctrl+C`.

## Connecting your ad accounts

1. Copy `.env.example` to `.env` (START.bat does this for you).
2. Fill in the keys for the platforms you use (see below). Leave the others blank.
3. Run `npm run clear-data` to remove the sample data.
4. Restart, go to **Integrations**, and click **Sync now**. After that, data syncs automatically every 6 hours (`SYNC_SCHEDULE` in `.env`).

Each sync re-pulls the last 30 days, so conversions that are attributed late still get counted.

### Google Ads
| Key | Where to get it |
|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads, then **Tools, then API Center**. Requires a manager (MCC) account, and **Basic access must be approved by Google**, which can take days. |
| `GOOGLE_ADS_CLIENT_ID` / `CLIENT_SECRET` | Google Cloud Console, then **APIs & Services, then Credentials**, then create an OAuth client (Desktop app). Enable the Google Ads API. |
| `GOOGLE_ADS_REFRESH_TOKEN` | Generate one with Google's OAuth Playground using your client ID/secret and the `https://www.googleapis.com/auth/adwords` scope. |
| `GOOGLE_ADS_CUSTOMER_ID` | The account ID shown top-right in Google Ads (e.g. `123-456-7890`). |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Only if you reach the account through a manager account: the manager's ID. |

### Meta Ads (Facebook / Instagram)
| Key | Where to get it |
|---|---|
| `META_ACCESS_TOKEN` | Create an app at developers.facebook.com (type: Business). Then, in **Business Settings, then System users**, create a system user, assign the ad account, and generate a token with `ads_read`. |
| `META_AD_ACCOUNT_ID` | Ads Manager, account dropdown (the number, with or without `act_`). |

Conversions and revenue use the purchase action by default. To count leads or another event instead, set `META_CONVERSION_ACTIONS`.

### LinkedIn Ads
| Key | Where to get it |
|---|---|
| `LINKEDIN_ACCESS_TOKEN` | Create an app at linkedin.com/developers and **request the Advertising API product**, which LinkedIn must approve. Then generate a token with `r_ads` and `r_ads_reporting`. Tokens last 60 days. |
| `LINKEDIN_AD_ACCOUNT_ID` | Campaign Manager, the account number in the URL. |

### API versions
Each platform retires old API versions periodically. If a sync starts failing with a version error, update `GOOGLE_ADS_API_VERSION`, `META_API_VERSION` or `LINKEDIN_API_VERSION` in `.env`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the API (port 5000) and dashboard (port 5173) |
| `npm run seed` | Replace all data with sample data |
| `npm run clear-data` | Delete all campaign and metric data |
| `npm test` | Run the backend tests |
| `npm run build` then `npm start` | Build the dashboard and serve everything from http://localhost:5000 |

## Project layout

```
marketing-dashboard/
├── backend/
│   ├── server.js            API server + sync scheduler
│   ├── db/index.js          SQLite schema (data/ads.db)
│   ├── integrations/        googleAds.js, metaAds.js, linkedinAds.js
│   ├── services/            sync.js (pull + save), store.js (upserts)
│   ├── routes/              analytics.js (summary, trend, campaigns), integrations.js
│   ├── scripts/seed.js      sample data
│   └── test/
├── frontend/                React + Vite
│   └── src/                 App.jsx, pages/, components/, lib.js, App.css
├── data/ads.db              your data (created on first run)
├── .env.example
└── START.bat
```

## API

All read endpoints accept `start` and `end` (`YYYY-MM-DD`) and default to the last 30 days.

- `GET /api/summary`: KPI totals, change vs. the previous period, and daily series
- `GET /api/trend?metric=spend|revenue|conversions|clicks&granularity=day|week|month`: values per bucket per platform
- `GET /api/campaigns?platform=&q=&sort=&order=`: campaigns with aggregated metrics
- `GET /api/integrations`: per-platform status
- `POST /api/integrations/:platform/sync`: sync one platform now (`google_ads`, `meta_ads`, `linkedin_ads`)

## Troubleshooting

- **Dashboard says "Could not load data"**: the API isn't running. Use `npm run dev`, not just the frontend.
- **Sync fails with HTTP 401/403**: the token is expired or missing a permission. LinkedIn tokens expire after 60 days.
- **Google says the developer token is not approved**: test-access tokens only work with test accounts. Apply for Basic access in the API Center.
