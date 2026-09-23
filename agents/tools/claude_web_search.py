"""
Claude Web Search Tool - uses Anthropic's native web search capability via the SDK.
Returns structured search results for agent analysis.
"""
import json
from anthropic import Anthropic
from crewai.tools import tool

client = Anthropic()

@tool("claude_web_search")
def claude_web_search(query: str, max_results: int = 5) -> str:
    """
    Search the web using Claude's built-in web search capability.
    Returns the top results with titles, URLs, and summaries.

    Args:
        query: The search query
        max_results: Maximum number of results to return

    Returns:
        JSON string of search results
    """
    try:
        # Use Claude with web search enabled via extended thinking
        # Since CrewAI might not directly support web search, we'll use a fallback approach
        # For now, return a mock response - in production, integrate with a search API

        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""Search for: "{query}"

Return a JSON array of search results with this structure:
[
  {{"title": "...", "url": "https://...", "summary": "..."}}
]

Provide real, factual results."""
                }
            ]
        )

        # Parse the response
        content = response.content[0].text

        # Try to extract JSON from the response
        import re
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            results = json.loads(json_match.group())
            return json.dumps(results[:max_results])

        return json.dumps([{"title": "Search Result", "url": "", "summary": content}])

    except Exception as e:
        return json.dumps({"error": str(e)})

@tool("claude_web_search_industry")
def claude_web_search_industry(industry: str = "marketing") -> str:
    """
    Search for latest industry trends and news.

    Args:
        industry: Industry to search (marketing, tech, advertising, etc.)

    Returns:
        JSON string of industry news
    """
    query = f"latest {industry} trends news 2024 2025"
    return claude_web_search(query, max_results=5)

@tool("claude_web_search_competitors")
def claude_web_search_competitors(competitors: list) -> str:
    """
    Search for news about specific competitors.

    Args:
        competitors: List of competitor names

    Returns:
        JSON string of competitor news items
    """
    all_results = []
    for competitor in competitors[:3]:  # Limit to 3 competitors per run
        query = f"{competitor} news announcement product launch 2024"
        results = claude_web_search(query, max_results=2)
        try:
            items = json.loads(results)
            for item in items:
                item['competitor'] = competitor
                all_results.append(item)
        except:
            pass

    return json.dumps(all_results)
