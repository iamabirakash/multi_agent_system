from typing import TypedDict, Callable, Optional, Any
import re
import logging
from urllib.parse import urlparse
from langgraph.graph import StateGraph, END
from agents import build_search_agent, writer_chain, critic_chain, extract_critic_score
from tools import scrape_url

logger = logging.getLogger(__name__)

class AgentState(TypedDict):
    topic: str
    search_result: str
    scraped_content: str
    selected_sources: str
    report: str
    feedback: str
    revision_count: int
    verbose: bool
    progress_callback: Optional[Callable[[str, str], None]]


def _to_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts = [_to_text(v) for v in value]
        return "\n".join([p for p in parts if p]).strip()
    if isinstance(value, dict):
        if "text" in value and isinstance(value["text"], str):
            return value["text"]
        if "content" in value:
            return _to_text(value["content"])
    return str(value)


def _parse_search_results(raw: str) -> list[dict]:
    raw_text = _to_text(raw)
    pattern = re.compile(
        r"Title:\s*(?P<title>.*?)\nURL:\s*(?P<url>.*?)\nSnippet:\s*(?P<snippet>.*?)(?:\n{2,}|\Z)",
        re.DOTALL,
    )
    items: list[dict] = []
    for match in pattern.finditer(raw_text):
        title = match.group("title").strip()
        url = match.group("url").strip()
        snippet = match.group("snippet").strip()
        if not url.startswith("http"):
            continue
        items.append({"title": title, "url": url, "snippet": snippet})
    return items


def _source_score(source: dict, topic: str) -> float:
    title = (source.get("title") or "").lower()
    snippet = (source.get("snippet") or "").lower()
    url = (source.get("url") or "").lower()

    topic_terms = [t for t in re.findall(r"[a-z0-9]+", topic.lower()) if len(t) > 2]
    combined = f"{title} {snippet}"

    relevance_hits = sum(1 for term in topic_terms if term in combined)
    relevance_score = min(relevance_hits / max(len(topic_terms), 1), 1.0) * 70

    credibility_score = 10
    trusted_domains = (
        ".gov",
        ".edu",
        "reuters.com",
        "apnews.com",
        "bbc.com",
        "nature.com",
        "who.int",
        "worldbank.org",
        "oecd.org",
    )
    if any(d in url for d in trusted_domains):
        credibility_score = 30

    return round(relevance_score + credibility_score, 2)


def _rank_sources(raw: str, topic: str, limit: int = 4) -> list[dict]:
    parsed = _parse_search_results(raw)
    for item in parsed:
        item["score"] = _source_score(item, topic)
    parsed.sort(key=lambda x: x.get("score", 0), reverse=True)
    return parsed[:limit]


def _domain_from_url(url: str) -> str:
    try:
        return urlparse(url).netloc or url
    except Exception:
        return url

def search_node(state: AgentState):
    logger.info("pipeline_search_started", extra={"topic": state.get("topic", "")})
    if state.get("progress_callback"):
        state["progress_callback"]("search", "running")
    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user", f"Find recent and reliable information on the topic: {state['topic']}")]
    })
    
    result = _to_text(search_result['messages'][-1].content)
    if state.get("progress_callback"):
        state["progress_callback"]("search", "done")

    if state.get("verbose"):
        logger.info("pipeline_search_result", extra={"topic": state.get("topic", ""), "chars": len(result)})
        
    return {"search_result": result}

def reader_node(state: AgentState):
    logger.info("pipeline_reader_started", extra={"topic": state.get("topic", "")})
    if state.get("progress_callback"):
        state["progress_callback"]("reader", "running")

    top_sources = _rank_sources(state["search_result"], state["topic"], limit=4)
    source_blocks: list[str] = []
    scraped_blocks: list[str] = []

    for idx, src in enumerate(top_sources, start=1):
        source_id = f"S{idx}"
        title = src.get("title") or "Untitled"
        url = src.get("url") or ""
        score = src.get("score", 0)
        snippet = src.get("snippet") or ""

        source_blocks.append(
            f"[{source_id}] {title}\nURL: {url}\nDomain: {_domain_from_url(url)}\nScore: {score}\nSnippet: {snippet}"
        )

        scraped_text = _to_text(scrape_url.invoke({"url": url}))
        scraped_blocks.append(
            f"[{source_id}] URL: {url}\nTitle: {title}\nScraped Content:\n{scraped_text}"
        )

    selected_sources_text = "\n\n".join(source_blocks)
    content = "\n\n".join(scraped_blocks)
    logger.info("pipeline_reader_completed", extra={"selected_source_count": len(top_sources), "scraped_chars": len(content)})

    if state.get("progress_callback"):
        state["progress_callback"]("reader", "done")

    return {"scraped_content": content, "selected_sources": selected_sources_text}

def writer_node(state: AgentState):
    logger.info("pipeline_writer_started", extra={"topic": state.get("topic", ""), "revision_count": state.get("revision_count", 0)})
    if state.get("progress_callback"):
        state["progress_callback"]("writer", "running")
        
    research_combined = (
        f"SEARCH RESULTS : \n{state['search_result']}\n\n"
        f"SCORED SELECTED SOURCES : \n{state.get('selected_sources', '')}\n\n"
        f"DETAILED SCRAPED CONTENT : \n{state['scraped_content']}"
    )
    
    feedback_instruction = ""
    if state.get("feedback"):
        feedback_instruction = f"CRITIC FEEDBACK FROM PREVIOUS DRAFT. Please revise the report based on this feedback carefully: \n{state['feedback']}"

    report = writer_chain.invoke({
        "topic": state['topic'],
        "research": research_combined,
        "feedback_instruction": feedback_instruction
    })
    
    if state.get("progress_callback"):
        state["progress_callback"]("writer", "done")

    if state.get("verbose"):
        logger.info("pipeline_writer_completed", extra={"revision_count": state.get("revision_count", 0), "report_chars": len(_to_text(report))})
        
    new_revision_count = state.get("revision_count", 0) + 1
    return {"report": report, "revision_count": new_revision_count}

def critic_node(state: AgentState):
    logger.info("pipeline_critic_started", extra={"revision_count": state.get("revision_count", 0)})
    if state.get("progress_callback"):
        # Reset writer and critic status to pending/running for the frontend
        state["progress_callback"]("critic", "running")
        
    feedback = critic_chain.invoke({
         "report" : state["report"]
    })
    
    if state.get("progress_callback"):
        state["progress_callback"]("critic", "done")

    if state.get("verbose"):
        logger.info("pipeline_critic_feedback", extra={"feedback_chars": len(_to_text(feedback))})
        
    return {"feedback": feedback}

def should_continue(state: AgentState):
    score = extract_critic_score(state["feedback"])
    logger.info("pipeline_critic_score", extra={"score": score, "revision_count": state.get("revision_count", 0)})
        
    # Max revisions = 2 (Writer runs max 3 times)
    if score >= 8.0 or state.get("revision_count", 0) > 2:
        return "end"
    else:
        # If we loop back to writer, we might want to signal the frontend
        if state.get("progress_callback"):
             state["progress_callback"]("writer", "pending")
             state["progress_callback"]("critic", "pending")
        return "continue"

# Build the graph
workflow = StateGraph(AgentState)

workflow.add_node("search", search_node)
workflow.add_node("reader", reader_node)
workflow.add_node("writer", writer_node)
workflow.add_node("critic", critic_node)

workflow.set_entry_point("search")
workflow.add_edge("search", "reader")
workflow.add_edge("reader", "writer")
workflow.add_edge("writer", "critic")

workflow.add_conditional_edges(
    "critic",
    should_continue,
    {
        "continue": "writer",
        "end": END
    }
)

app_workflow = workflow.compile()

def run_research_pipeline(topic: str, verbose: bool = True, progress_callback=None) -> dict:
    logger.info("pipeline_started", extra={"topic": topic})
    initial_state = {
        "topic": topic,
        "search_result": "",
        "scraped_content": "",
        "selected_sources": "",
        "report": "",
        "feedback": "",
        "revision_count": 0,
        "verbose": verbose,
        "progress_callback": progress_callback
    }
    
    final_state = app_workflow.invoke(initial_state)
    logger.info("pipeline_completed", extra={"topic": topic, "final_revision_count": final_state.get("revision_count", 0)})
    return final_state

if __name__ == "__main__":
    topic = input("\n Enter a research topic : ")
    def dummy_progress(step, status):
        logger.info("pipeline_progress", extra={"step": step, "status": status})
    run_research_pipeline(topic, verbose=True, progress_callback=dummy_progress)
