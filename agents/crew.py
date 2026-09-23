"""
CrewAI Crew definition for Marketing Dashboard agents.
Agents collaborate to surface trends, analyze competitors, review performance, and report to Slack.
"""
from crewai import Agent, Crew, Process, Task
from crewai_tools import tool
import json

# Import custom tools
from tools.claude_web_search import (
    claude_web_search,
    claude_web_search_industry,
    claude_web_search_competitors
)
from tools.db_tools import (
    read_campaign_metrics,
    write_news_item,
    get_campaign_list,
    get_performance_summary
)
from tools.slack_tool import post_slack_message, post_slack_blocks, build_summary_blocks
from config import COMPETITORS, LLM_MODEL

# Define agents
news_researcher = Agent(
    role="Industry News Researcher",
    goal="Find and analyze the latest marketing industry trends and news",
    backstory="You are an expert at staying on top of marketing industry news, trends, and developments. You search for and synthesize information about new advertising platforms, marketing strategies, and industry shifts.",
    tools=[claude_web_search_industry, write_news_item],
    verbose=True,
    allow_delegation=False,
    llm_config={
        "model": LLM_MODEL,
        "temperature": 0.7,
    }
)

competitor_analyst = Agent(
    role="Competitor Intelligence Analyst",
    goal="Monitor and analyze competitor activities and announcements",
    backstory="You specialize in competitive intelligence. You search for news about major competitors' product launches, strategy changes, and market moves. You help identify opportunities and threats in the competitive landscape.",
    tools=[claude_web_search_competitors, write_news_item],
    verbose=True,
    allow_delegation=False,
    llm_config={
        "model": LLM_MODEL,
        "temperature": 0.7,
    }
)

performance_analyst = Agent(
    role="Performance Analytics Specialist",
    goal="Analyze marketing campaign performance and provide insights",
    backstory="You are a data analyst specializing in marketing metrics. You review campaign performance data, identify trends, calculate ROI/ROAS, and provide actionable recommendations for optimizing ad spend.",
    tools=[read_campaign_metrics, get_campaign_list, get_performance_summary],
    verbose=True,
    allow_delegation=False,
    llm_config={
        "model": LLM_MODEL,
        "temperature": 0.7,
    }
)

slack_reporter = Agent(
    role="Slack Communications Specialist",
    goal="Compile and report findings to the team via Slack",
    backstory="You are excellent at synthesizing complex information into clear, actionable summaries. You take findings from other agents and format them into compelling Slack messages that keep the marketing team informed and aligned.",
    tools=[post_slack_message, post_slack_blocks],
    verbose=True,
    allow_delegation=False,
    llm_config={
        "model": LLM_MODEL,
        "temperature": 0.7,
    }
)

# Define tasks
search_trends_task = Task(
    description="Search for the latest marketing and advertising industry trends from the past 24 hours. Look for news about: new ad formats, algorithm changes, platform updates, industry reports, and emerging strategies. Write each finding as a news item.",
    agent=news_researcher,
    expected_output="A summary of at least 3 industry trends found and written to the database"
)

analyze_competitors_task = Task(
    description=f"Search for recent news about these competitors: {', '.join(COMPETITORS)}. Look for product launches, funding announcements, partnership news, and strategic moves. Write each finding as a competitor news item.",
    agent=competitor_analyst,
    expected_output="A summary of competitor activities found and written to the database"
)

analyze_performance_task = Task(
    description="Read the current campaign metrics from the database. Analyze the performance of all active campaigns over the last 7 days. Calculate total ROI and ROAS. Identify top-performing and underperforming campaigns. Provide specific recommendations for budget optimization.",
    agent=performance_analyst,
    expected_output="A detailed performance analysis with metrics, trends, and 3-5 specific recommendations"
)

report_to_slack_task = Task(
    description="Based on the findings from the news researcher, competitor analyst, and performance analyst, compile a comprehensive summary for Slack. Include: top industry trends (3-4 items), competitor highlights (2-3 items), performance insights with metrics, and top 2-3 budget optimization recommendations. Format as a professional Slack message that's easy to scan.",
    agent=slack_reporter,
    expected_output="A formatted Slack message posted to the webhook with all key findings and recommendations"
)

def create_crew():
    """Create and return the marketing dashboard crew."""
    crew = Crew(
        agents=[news_researcher, competitor_analyst, performance_analyst, slack_reporter],
        tasks=[search_trends_task, analyze_competitors_task, analyze_performance_task, report_to_slack_task],
        verbose=True,
        process=Process.sequential,  # Run agents sequentially
        memory=False,
    )
    return crew

def run_crew_analysis():
    """Execute the crew and return the results."""
    crew = create_crew()

    try:
        print("\n" + "="*80)
        print("🤖 MARKETING DASHBOARD AGENT CREW STARTED")
        print("="*80 + "\n")

        # Execute all tasks
        result = crew.kickoff()

        print("\n" + "="*80)
        print("✓ MARKETING DASHBOARD AGENT CREW COMPLETED")
        print("="*80 + "\n")

        return {
            "status": "completed",
            "summary": str(result),
            "message": "Agent analysis completed successfully"
        }
    except Exception as e:
        print(f"\n✗ Agent Crew Error: {str(e)}\n")
        return {
            "status": "failed",
            "error": str(e),
            "message": "Agent analysis failed"
        }
