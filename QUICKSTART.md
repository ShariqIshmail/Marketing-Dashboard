# Quick Start Guide

Get the Marketing Dashboard running in 5 minutes.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] **PostgreSQL** installed and running locally
- [ ] **Node.js** (v16+) installed
- [ ] **Python** (v3.10+) installed
- [ ] **ANTHROPIC_API_KEY** from https://console.anthropic.com
- [ ] **Slack Webhook URL** (optional, for Slack notifications)

## Step 1: Setup Environment

```bash
cd "C:\Users\svr07\OneDrive\Desktop\Business\marketing-dashboard"

# Copy and edit the environment file
copy .env.example .env

# Edit .env with your values:
# - DB_PASSWORD (your Postgres password)
# - ANTHROPIC_API_KEY (your Claude API key)
# - SLACK_WEBHOOK_URL (optional)
```

## Step 2: Create Database

Open PowerShell and create the database:

```powershell
psql -U postgres
```

Then in the psql prompt:

```sql
CREATE DATABASE marketing_dashboard;
\q
```

## Step 3: Start Backend

Open a new PowerShell terminal:

```powershell
cd "C:\Users\svr07\OneDrive\Desktop\Business\marketing-dashboard\backend"
npm install
npm run init-db
npm run dev
```

Expected output:
```
✓ Marketing Dashboard Backend running on http://localhost:5000
```

## Step 4: Start Frontend

Open another PowerShell terminal:

```powershell
cd "C:\Users\svr07\OneDrive\Desktop\Business\marketing-dashboard\frontend"
npm install
npm start
```

Expected output:
```
Compiled successfully!
You can now view lead-crm-frontend in the browser.
  Local:            http://localhost:3000
```

## Step 5: Start Agent Service

Open a third PowerShell terminal:

```powershell
cd "C:\Users\svr07\OneDrive\Desktop\Business\marketing-dashboard\agents"
pip install -r requirements.txt
python main.py
```

Expected output:
```
✓ Agent Service starting on port 5001
```

## Step 6: Test the Dashboard

1. Open http://localhost:3000 in your browser
2. You should see the dark-themed dashboard
3. Click "Run Agent Now" to trigger the agent
4. Watch the terminals for agent activity
5. Check Slack channel (if configured) for summaries

## Quick Tests

### Test Backend API
```powershell
curl -X GET http://localhost:5000/health
curl -X GET http://localhost:5000/api/campaigns
```

### Test Agent Service
```powershell
curl -X GET http://localhost:5001/health
curl -X POST http://localhost:5001/run-crew
```

### Add Test Data
Use the Dashboard UI → Analytics tab:
1. Create a test campaign
2. Add daily metrics
3. Run agent to generate news

## All-in-One Launcher

After everything is set up once, you can use:

```powershell
cd "C:\Users\svr07\OneDrive\Desktop\Business\marketing-dashboard"
.\START.bat
```

This opens all three services in separate windows.

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running. Start it with:
```powershell
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

### ANTHROPIC_API_KEY Error
```
ValueError: ANTHROPIC_API_KEY environment variable is required
```
**Solution**: Add your API key to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### npm install fails
```
npm ERR! The following packages could not be satisfied:
```
**Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again:
```powershell
rm -r node_modules package-lock.json
npm install
```

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change the port in `.env` or kill the process:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Next Steps

1. **Add campaigns** in the Analytics tab
2. **Enter metrics** daily (or wire up Google Ads/Meta APIs)
3. **Run agent** to fetch news and analyze performance
4. **Check Slack** for daily summaries
5. **Explore trends** in the News & Trends tab

## Documentation

- See [README.md](./README.md) for full feature documentation
- Check [backend/README.md](./backend/README.md) for API docs (to be added)
- See [agents/README.md](./agents/README.md) for agent customization (to be added)

## Support

If you encounter issues:

1. Check the terminal output for error messages
2. Verify `.env` file configuration
3. Ensure all services are running (3 terminals)
4. Check database connection with `psql -U postgres -d marketing_dashboard`
5. Review logs in each service's terminal

Happy dashboarding! 📊
