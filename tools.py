from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
import logging
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on a topic. Returns Titles, URLs, and Snippets."""
    try:
        logger.info("web_search_started", extra={"query": query, "max_results": 10})
        results = tavily.search(query=query,max_results=10)
    except Exception:
        logger.exception("web_search_failed", extra={"query": query})
        return "Error performing web search. Please try again later."

    out = []

    for r in results['results']:
        out.append(f"Title: {r['title']}\nURL: {r['url']}\nSnippet: {r['content'][:600]}\n")

    logger.info("web_search_completed", extra={"query": query, "result_count": len(out)})
    return "\n".join(out)

@tool
def scrape_url(url : str) -> str:
    """Scrape and return clean text content from a given url for deeper reading."""
    try:
        logger.info("scrape_url_started", extra={"url": url})
        resp = requests.get(url,timeout=10,headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "footer", "nav"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)[:8000] # More context for richer report generation
        logger.info("scrape_url_completed", extra={"url": url, "chars_returned": len(text)})
        return text
    except Exception:
        logger.exception("scrape_url_failed", extra={"url": url})
        return "Error scraping URL. Please check the URL or try again later."
