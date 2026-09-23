# PostgreSQL Setup Guide (Windows)

## If PostgreSQL is Already Installed

### Start PostgreSQL Service

Open PowerShell **as Administrator** and run:

```powershell
# Check if PostgreSQL service is running
Get-Service postgresql-x64-15

# If not running, start it:
Start-Service postgresql-x64-15
```

Or use Windows Services:
1. Press `Win + R`, type `services.msc`
2. Find "postgresql-x64-15"
3. Right-click and select "Start"

### Create Database

```powershell
psql -U postgres
```

Then in psql:

```sql
CREATE DATABASE marketing_dashboard;
\q
```

---

## If PostgreSQL is NOT Installed

### Step 1: Download PostgreSQL

1. Go to https://www.postgresql.org/download/windows/
2. Download PostgreSQL 15 or 16
3. Run the installer

### Step 2: Run Installer

1. Accept the license
2. Choose installation directory (default: `C:\Program Files\PostgreSQL\15`)
3. Choose components (check: Database Server, pgAdmin 4, Stack Builder)
4. Set data directory (default works fine)
5. **Important**: Remember the superuser password (you'll set it as `postgres` user password)
6. Set port: **5432** (default)
7. Set locale: **[Default locale]**
8. Click Install

### Step 3: Create Database After Installation

Open PowerShell and run:

```powershell
# This will prompt for postgres password (the one you set in installer)
psql -U postgres
```

Then in psql:

```sql
CREATE DATABASE marketing_dashboard;
\q
```

---

## Verify Installation

### Test Connection

```powershell
# Connect with psql
psql -U postgres -d postgres -c "SELECT VERSION();"
```

You should see the PostgreSQL version.

### Test Dashboard Database

```powershell
psql -U postgres -d marketing_dashboard -c "\dt"
```

After running the backend initialization, you should see tables like:
- campaigns
- ad_metrics
- news_items
- agent_runs
- slack_posts

---

## Update .env with Your Setup

Edit `.env` and ensure these match your PostgreSQL setup:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketing_dashboard
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

---

## Troubleshooting

### "psql: command not found"

PostgreSQL wasn't added to PATH. Either:

**Option 1**: Use full path
```powershell
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres
```

**Option 2**: Add to PATH permanently
1. Right-click "This PC" → Properties
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Click "New" under System variables
5. Variable name: `POSTGRESQL_PATH`
6. Variable value: `C:\Program Files\PostgreSQL\15\bin`
7. Click OK
8. Edit `Path` variable, click "New", add `%POSTGRESQL_PATH%`
9. Restart PowerShell

### "role 'postgres' does not exist"

Re-run the installer and select "Install as Windows service" option.

### "database 'marketing_dashboard' already exists"

Drop and recreate:
```sql
DROP DATABASE marketing_dashboard;
CREATE DATABASE marketing_dashboard;
```

### Port 5432 already in use

Change in `.env`:
```env
DB_PORT=5433
```

Then specify port when connecting:
```powershell
psql -U postgres -p 5433
```

### Permission denied

Make sure you're using the correct password for the `postgres` user (set during installation).

---

## Common psql Commands

```sql
-- List all databases
\l

-- Connect to a database
\c marketing_dashboard

-- List tables
\dt

-- Show table structure
\d campaigns

-- Execute SQL file
\i "C:\path\to\schema.sql"

-- Exit psql
\q
```

---

## Windows Service Management

### Start PostgreSQL
```powershell
Start-Service postgresql-x64-15
```

### Stop PostgreSQL
```powershell
Stop-Service postgresql-x64-15
```

### Check Status
```powershell
Get-Service postgresql-x64-15
```

### Auto-start on boot
Should be set to "Automatic" by default, but to verify:
1. Open Services (Win + R → `services.msc`)
2. Find postgresql-x64-15
3. Right-click → Properties
4. Set "Startup type" to "Automatic"

---

## Next Steps

Once PostgreSQL is running and the `marketing_dashboard` database is created:

1. Go back to [QUICKSTART.md](./QUICKSTART.md)
2. Start the backend: `npm run init-db` (initializes schema)
3. Start the frontend and agent service

You're all set! 🎉
