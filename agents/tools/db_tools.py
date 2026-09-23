"""
Database tools for agents to read and write data.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import json
from crewai.tools import tool
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

def get_db_connection():
    """Create a database connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

@tool("read_campaign_metrics")
def read_campaign_metrics(days: int = 7) -> str:
    """
    Read recent campaign metrics from the database.

    Args:
        days: Number of days of historical data to fetch

    Returns:
        JSON string of metrics
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
        SELECT
            c.name as campaign_name,
            c.platform,
            SUM(m.spend) as total_spend,
            SUM(m.revenue) as total_revenue,
            SUM(m.conversions) as total_conversions,
            SUM(m.impressions) as total_impressions,
            SUM(m.clicks) as total_clicks,
            CASE WHEN SUM(m.spend) > 0
                 THEN ROUND((SUM(m.revenue) - SUM(m.spend)) / SUM(m.spend) * 100, 2)
                 ELSE 0 END as roi_percent,
            CASE WHEN SUM(m.spend) > 0
                 THEN ROUND(SUM(m.revenue) / SUM(m.spend)::numeric, 2)
                 ELSE 0 END as roas
        FROM campaigns c
        LEFT JOIN ad_metrics m ON c.id = m.campaign_id
        WHERE m.date >= CURRENT_DATE - INTERVAL '%s days'
        GROUP BY c.id, c.name, c.platform
        ORDER BY total_spend DESC
        """ % days

        cur.execute(query)
        rows = cur.fetchall()

        metrics = [dict(row) for row in rows]

        cur.close()
        conn.close()

        return json.dumps(metrics)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool("write_news_item")
def write_news_item(title: str, summary: str = "", url: str = "",
                    category: str = "trend", competitor_name: str = None,
                    sentiment: str = None) -> str:
    """
    Write a news item to the database.

    Args:
        title: News title
        summary: News summary/description
        url: News URL
        category: 'trend' or 'competitor'
        competitor_name: Name of competitor (if applicable)
        sentiment: 'positive', 'neutral', or 'negative'

    Returns:
        JSON string with result
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        query = """
        INSERT INTO news_items (title, summary, url, category, competitor_name, sentiment)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, title, created_at
        """

        cur.execute(query, (title, summary or None, url or None, category,
                           competitor_name or None, sentiment or None))

        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return json.dumps({
            "success": True,
            "id": result[0],
            "title": result[1],
            "created_at": str(result[2])
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

@tool("get_campaign_list")
def get_campaign_list() -> str:
    """
    Get list of all active campaigns.

    Returns:
        JSON string of campaigns
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = "SELECT id, name, platform, status FROM campaigns WHERE status = 'active' ORDER BY name"
        cur.execute(query)
        rows = cur.fetchall()

        campaigns = [dict(row) for row in rows]

        cur.close()
        conn.close()

        return json.dumps(campaigns)
    except Exception as e:
        return json.dumps({"error": str(e)})

@tool("get_performance_summary")
def get_performance_summary() -> str:
    """
    Get overall performance summary for analysis.

    Returns:
        JSON string of performance metrics
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
        SELECT
            COUNT(DISTINCT c.id) as total_campaigns,
            SUM(m.spend) as total_spend,
            SUM(m.revenue) as total_revenue,
            SUM(m.conversions) as total_conversions,
            CASE WHEN SUM(m.spend) > 0
                 THEN ROUND((SUM(m.revenue) - SUM(m.spend)) / SUM(m.spend) * 100, 2)
                 ELSE 0 END as overall_roi,
            CASE WHEN SUM(m.spend) > 0
                 THEN ROUND(SUM(m.revenue) / SUM(m.spend)::numeric, 2)
                 ELSE 0 END as overall_roas
        FROM campaigns c
        LEFT JOIN ad_metrics m ON c.id = m.campaign_id
        WHERE m.date >= CURRENT_DATE - INTERVAL '7 days'
        AND c.status = 'active'
        """

        cur.execute(query)
        result = cur.fetchone()

        cur.close()
        conn.close()

        return json.dumps(dict(result))
    except Exception as e:
        return json.dumps({"error": str(e)})
