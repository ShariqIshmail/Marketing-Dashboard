"""
FastAPI server for CrewAI agent orchestration.
Exposes endpoints to trigger and monitor agent runs.
"""
import sys
import argparse
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import psycopg2
from datetime import datetime
import requests

from crew import run_crew_analysis
from config import (
    AGENT_SERVICE_PORT,
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    BACKEND_URL
)

# Create FastAPI app
app = FastAPI(
    title="Marketing Dashboard Agent Service",
    version="0.1.0",
    description="CrewAI agent orchestration for marketing dashboard"
)

def get_db_connection():
    """Create a database connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def log_agent_run(status: str, summary: str = None, error: str = None, news_count: int = 0):
    """Log an agent run to the database."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        query = """
        INSERT INTO agent_runs (status, summary, error, news_count, finished_at)
        VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
        RETURNING id
        """

        cur.execute(query, (status, summary, error, news_count))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return result[0] if result else None
    except Exception as e:
        print(f"Error logging agent run: {e}")
        return None

@app.on_event("startup")
async def startup_event():
    """Log startup."""
    print(f"\n✓ Agent Service starting on port {AGENT_SERVICE_PORT}")
    print(f"  Backend: {BACKEND_URL}")
    print(f"  Database: {DB_HOST}:{DB_PORT}/{DB_NAME}\n")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT NOW()")
        cur.fetchone()
        cur.close()
        conn.close()

        return {
            "status": "healthy",
            "service": "Agent Service",
            "timestamp": datetime.now().isoformat(),
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database": "disconnected"
        }

@app.post("/run-crew")
async def run_crew():
    """
    Trigger the CrewAI crew to run.
    Executes news research, competitor analysis, performance analysis, and Slack reporting.
    """
    print("\n" + "="*80)
    print("📋 Agent Run Triggered via /run-crew endpoint")
    print("="*80 + "\n")

    try:
        # Run the crew
        result = run_crew_analysis()

        # Count news items created in this run
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM news_items WHERE created_at >= NOW() - INTERVAL '5 minutes'")
            news_count = cur.fetchone()[0]
            cur.close()
            conn.close()
        except:
            news_count = 0

        # Log the run to database
        run_id = log_agent_run(
            status=result["status"],
            summary=result.get("summary", result.get("message")),
            error=result.get("error"),
            news_count=news_count
        )

        # Return response
        response_data = {
            **result,
            "run_id": run_id,
            "news_count": news_count,
            "timestamp": datetime.now().isoformat()
        }

        print(f"\n✓ Agent run completed (ID: {run_id})")
        return response_data

    except Exception as e:
        error_msg = str(e)
        print(f"\n✗ Agent run failed: {error_msg}")

        # Log the failed run
        run_id = log_agent_run(
            status="failed",
            error=error_msg
        )

        return {
            "status": "failed",
            "error": error_msg,
            "run_id": run_id,
            "timestamp": datetime.now().isoformat()
        }

@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Marketing Dashboard Agent Service",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "GET /": "This message",
            "GET /health": "Service health check",
            "POST /run-crew": "Trigger agent crew to run"
        }
    }

def run_once():
    """Run the crew once and exit (for command line usage)."""
    print("\n" + "="*80)
    print("🤖 Running Agent Crew (--once mode)")
    print("="*80 + "\n")

    result = run_crew_analysis()

    # Count news items
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM news_items WHERE created_at >= NOW() - INTERVAL '5 minutes'")
        news_count = cur.fetchone()[0]
        cur.close()
        conn.close()
    except:
        news_count = 0

    # Log the run
    run_id = log_agent_run(
        status=result["status"],
        summary=result.get("summary"),
        error=result.get("error"),
        news_count=news_count
    )

    print("\n" + "="*80)
    print("✓ Agent run complete")
    print(f"  Run ID: {run_id}")
    print(f"  Status: {result['status']}")
    print(f"  News items: {news_count}")
    print("="*80 + "\n")

    sys.exit(0 if result["status"] == "completed" else 1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Marketing Dashboard Agent Service")
    parser.add_argument("--once", action="store_true", help="Run crew once and exit")
    parser.add_argument("--port", type=int, default=AGENT_SERVICE_PORT, help="Port to run on")

    args = parser.parse_args()

    if args.once:
        run_once()
    else:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=args.port)
