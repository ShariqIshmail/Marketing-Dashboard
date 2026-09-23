# Marketing Dashboard with AI Agents

A comprehensive marketing analytics dashboard powered by CrewAI agents that automatically surfaces industry trends, analyzes competitor moves, and optimizes ad spend across Google Ads and Meta platforms.

## Features

✨ **AI-Powered Insights**
- Daily industry news & trends via Claude AI web search
- Automated competitor monitoring and alerts
- Performance analysis with ROI/ROAS calculations
- Slack integration for daily summaries

📊 **Analytics Dashboard**
- Real-time ad spend & revenue tracking
- ROI, ROAS, and budget utilization gauges
- Multi-platform support (Google Ads, Meta, manual entry)
- Visual analytics with line charts and circular progress indicators

🤖 **CrewAI Agent System**
- News Researcher agent for daily trends
- Competitor Analyst for competitive intelligence
- Performance Analyzer for budget recommendations
- Slack Reporter for automated summaries

## Prerequisites

- **Node.js** 16+ (backend & frontend)
- **Python** 3.10+ (CrewAI agents)
- **PostgreSQL** 12+ (local database)
- **ANTHROPIC_API_KEY** (Claude API access)
- **Slack Webhook URL** (for Slack integration, optional)

## Setup

### 1. Clone / Create Project
```bash
cd "C:\Users\svr07\OneDrive\Desktop\Business\marketing-dashboard"
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values:
# - DB_PASSWORD (your Postgres password)
# - ANTHROPIC_API_KEY (from console.anthropic.com)
# - SLACK_WEBHOOK_URL (from your Slack workspace)
```

### 3. Create PostgreSQL Database
```bash
psql -U postgres
CREATE DATABASE marketing_dashboard;
\q
```

### 4. Install & Start Backend
```bash
cd backend
npm install
npm run init-db   # Initialize schema
npm run dev       # Start on http://localhost:5000
```

### 5. Install & Start Frontend
(In a new terminal)
```bash
cd frontend
npm install
npm start         # Start on http://localhost:3000
```

### 6. Install & Start Agent Service
(In a new terminal)
```bash
cd agents
pip install -r requirements.txt
python main.py    # Start on http://localhost:5001
# Or trigger manually: python main.py --once
```

### Quick Start Script
Run `START.bat` to launch all three services in separate windows.

## API Endpoints

### Backend (Node)

**Campaigns**
- `GET /api/campaigns` — List all campaigns
- `POST /api/campaigns` — Create campaign
- `PUT /api/campaigns/:id` — Update campaign
- `DELETE /api/campaigns/:id` — Delete campaign

**Metrics**
- `GET /api/metrics` — Aggregated metrics (daily/weekly/monthly) with ROI/ROAS
- `POST /api/metrics` — Add manual metric entry
- `GET /api/metrics/summary` — Top-level KPIs

**News & Trends**
- `GET /api/news` — All news items (trends + competitors)
- `GET /api/news?category=trend` — Industry trends only
- `GET /api/news?category=competitor` — Competitor news only

**Agent Control**
- `POST /api/agent/run` — Trigger agent crew immediately
- `GET /api/agent/runs` — Agent run history
- `GET /api/agent/runs/:id` — Detailed run results

**Slack**
- `POST /api/slack/trigger` — Manually push summary to Slack

### Agent Service (Python)

- `POST /run-crew` — Trigger CrewAI crew, returns agent outputs
- `GET /health` — Service health check

## Dashboard Features

### Summary Cards
- **Total Ad Spend** — sum of all campaigns this period
- **ROAS** — revenue ÷ spend, calculated from metrics
- **ROI %** — (revenue − spend) ÷ spend × 100
- **Active Campaigns** — count of non-paused campaigns

### Charts
- **Spend vs Revenue** — line chart over time (daily/weekly/monthly)
- **Campaign Performance** — bar chart by campaign name
- **ROI Trends** — area chart of ROI % over time

### Gauges
- **ROAS** — circular progress indicator (target: 3:1)
- **ROI %** — circular progress indicator (target: 100%)
- **Budget Utilization** — circular progress indicator (% of monthly budget spent)

### Agent Activity
- View latest agent run results
- Last Slack summary preview
- "Run Agent Now" button for manual triggers

## Creating Campaigns & Entering Metrics

### Via Dashboard UI
1. Go to Analytics → Add Campaign
2. Enter campaign name and select platform (Manual / Google Ads / Meta Ads)
3. Click "Add Metric" to enter daily spend/revenue
4. Dashboard updates automatically

### Via API (curl example)
```bash
# Create a campaign
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Q4 Social","platform":"manual","status":"active"}'

# Add a metric
curl -X POST http://localhost:5000/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"campaign_id":1,"date":"2026-09-23","spend":500,"revenue":2000,"conversions":10}'
```

## Agent System

### How It Works
1. **Scheduled**: Node backend triggers the Python agent service daily (default: 7 AM)
2. **Runs**: 4 CrewAI agents run in parallel:
   - News Researcher: Finds industry trends (marketing, tech, ads)
   - Competitor Analyst: Searches for competitor news
   - Performance Analyzer: Analyzes your metrics, flags anomalies
   - Slack Reporter: Compiles summaries and posts to Slack
3. **Results**: News items saved to DB, Slack message posted, run logged

### Manual Trigger
```bash
# From the dashboard: click "Run Agent Now"
# OR via API:
curl -X POST http://localhost:5000/api/agent/run

# OR standalone (Python):
cd agents
python main.py --once
```

## Google Ads & Meta Ads Integration

Currently, manual entry is the primary input method. When you're ready to connect live APIs:

### Google Ads Setup
1. Create a developer account at ads.google.com/dev
2. Request a developer token (requires business verification)
3. Create an OAuth app at cloud.google.com/console
4. Set `GOOGLE_ADS_*` env vars
5. Routes are ready at `backend/routes/integrations/googleAds.js`

### Meta Ads Setup
1. Create a Meta Business Account
2. Create a Marketing API app at developers.facebook.com
3. Generate an access token
4. Set `META_ACCESS_TOKEN` env var
5. Routes are ready at `backend/routes/integrations/metaAds.js`

See `backend/routes/integrations/README.md` for detailed OAuth flow docs (to be added).

## Environment & Dependencies

### Node Packages
- `express` — REST API server
- `pg` — PostgreSQL driver
- `node-cron` — Scheduled jobs
- `axios` — HTTP client
- `cors`, `dotenv` — Middleware & config

### Python Packages
- `crewai` — Multi-agent orchestration
- `fastapi`, `uvicorn` — REST API
- `psycopg2` — PostgreSQL driver
- `requests`, `anthropic` — API clients
- `python-dotenv` — Environment config

### React Packages
- `react`, `react-dom` — UI framework
- `recharts` — Data visualization (charts & gauges)
- `axios` — HTTP client
- `react-router-dom` — Routing
- `tailwindcss` (or custom CSS) — Dark theme styling

## Troubleshooting

**"Database connection failed"**
- Confirm PostgreSQL is running: `psql -U postgres`
- Check `.env` DB credentials
- Ensure `marketing_dashboard` database exists

**"ANTHROPIC_API_KEY not set"**
- Get a key from https://console.anthropic.com
- Add it to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

**"Agent service not responding"**
- Confirm Python service is running: `curl http://localhost:5001/health`
- Check Python error logs in terminal

**"Slack message not posting"**
- Verify `SLACK_WEBHOOK_URL` in `.env`
- Test with curl: `curl -X POST <WEBHOOK_URL> -d '{"text":"test"}'`

## File Structure

```
marketing-dashboard/
├── backend/              # Node/Express API
│   ├── server.js         # Main server entry
│   ├── package.json
│   ├── db/
│   │   ├── connection.js # Postgres pool
│   │   ├── schema.sql    # Database schema
│   │   └── init.js       # Schema initializer
│   ├── routes/
│   │   ├── campaigns.js
│   │   ├── metrics.js
│   │   ├── news.js
│   │   ├── agent.js
│   │   ├── slack.js
│   │   └── integrations/
│   │       ├── googleAds.js
│   │       └── metaAds.js
│   └── utils/            # Helper functions
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Dashboard pages
│   │   └── utils/        # API client, helpers
│   ├── package.json
│   └── public/
├── agents/               # Python CrewAI service
│   ├── main.py          # FastAPI server
│   ├── crew.py          # CrewAI definition
│   ├── tools/           # Custom tools
│   │   ├── claude_web_search.py
│   │   ├── db_tools.py
│   │   └── slack_tool.py
│   ├── requirements.txt
│   └── config.py        # Agent config
├── .env.example
├── README.md
└── START.bat            # Quick launcher

```

## Next Steps

1. ✅ Set up PostgreSQL database
2. ✅ Configure `.env` file
3. ✅ Start backend + frontend + agent service
4. 🔄 Add your first campaign & metrics via UI
5. ▶️ Click "Run Agent Now" to see agents in action
6. 📲 Check Slack channel for summary
7. 🔌 When ready: wire up Google Ads & Meta Ads APIs

## Support

For issues or questions:
- Check the Troubleshooting section above
- Review logs in the running terminals
- Check `.env` and database connection
- Ensure all services are running (3 terminals)

## License

Private — built for your marketing ops.
