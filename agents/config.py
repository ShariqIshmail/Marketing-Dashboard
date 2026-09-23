import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# API Keys
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

# Database
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 5432))
DB_NAME = os.getenv('DB_NAME', 'marketing_dashboard')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD')

# Slack
SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL')

# Agent Service
AGENT_SERVICE_PORT = int(os.getenv('AGENT_SERVICE_PORT', 5001))
AGENT_SERVICE_HOST = os.getenv('AGENT_SERVICE_HOST', 'http://localhost:5001')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

# Competitors list
COMPETITORS = os.getenv('COMPETITORS_LIST', 'Facebook,Google,TikTok,Amazon').split(',')
COMPETITORS = [c.strip() for c in COMPETITORS]

# Model
LLM_MODEL = 'claude-3-5-sonnet-20241022'

# Validation
if not ANTHROPIC_API_KEY:
    raise ValueError('ANTHROPIC_API_KEY environment variable is required')

if not DB_PASSWORD:
    raise ValueError('DB_PASSWORD environment variable is required')
