-- Marketing Dashboard Database Schema

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('google_ads', 'meta_ads', 'manual')),
  external_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad Metrics Table
CREATE TABLE IF NOT EXISTS ad_metrics (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend DECIMAL(12, 2) NOT NULL DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('api', 'manual')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, date)
);

-- News Items Table
CREATE TABLE IF NOT EXISTS news_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  url VARCHAR(500),
  category VARCHAR(50) NOT NULL CHECK (category IN ('trend', 'competitor')),
  competitor_name VARCHAR(255),
  sentiment VARCHAR(50) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Runs Table
CREATE TABLE IF NOT EXISTS agent_runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  summary TEXT,
  error TEXT,
  news_count INTEGER DEFAULT 0,
  metrics_found INTEGER DEFAULT 0
);

-- Slack Posts Table
CREATE TABLE IF NOT EXISTS slack_posts (
  id SERIAL PRIMARY KEY,
  agent_run_id INTEGER REFERENCES agent_runs(id) ON DELETE CASCADE,
  content TEXT,
  slack_channel VARCHAR(255),
  posted_at TIMESTAMP,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google Ads Integration Table (future use)
CREATE TABLE IF NOT EXISTS google_ads_accounts (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Meta Ads Integration Table (future use)
CREATE TABLE IF NOT EXISTS meta_ads_accounts (
  id SERIAL PRIMARY KEY,
  business_account_id VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT,
  token_expires_at TIMESTAMP,
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_metrics_campaign_id ON ad_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics(date);
CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items(category);
CREATE INDEX IF NOT EXISTS idx_news_items_competitor ON news_items(competitor_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
