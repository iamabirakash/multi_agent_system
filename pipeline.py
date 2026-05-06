from typing import TypedDict, Callable, Optional, Any
from langgraph.graph import StateGraph, END
from agents import build_search_agent, build_reader_agent, writer_chain, critic_chain, extract_critic_score

class AgentState(TypedDict):
    topic: str
    search_result: str
    scraped_content: str
    report: str
    feedback: str
    revision_count: int
    verbose: bool
    progress_callback: Optional[Callable[[str, str], None]]

def search_node(state: AgentState):
    if state.get("progress_callback"):
        state["progress_callback"]("search", "running")
    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user", f"Find recent and reliable information on the topic: {state['topic']}")]
    })
    
    result = search_result['messages'][-1].content
    if state.get("progress_callback"):
        state["progress_callback"]("search", "done")
        
    if state.get("verbose"):
        print("\n Search Result:", result)
        
    return {"search_result": result}

def reader_node(state: AgentState):
    if state.get("progress_callback"):
        state["progress_callback"]("reader", "running")
    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [("user",
            f"Based on the following search results about '{state['topic']}', "
            f"pick the most relevant URL and scrape it for deeper content.\n\n"
            f"Search Results:\n{state['search_result']}"
        )]
    })
    
    content = reader_result['messages'][-1].content
    if state.get("progress_callback"):
        state["progress_callback"]("reader", "done")
        
    return {"scraped_content": content}

def writer_node(state: AgentState):
    if state.get("progress_callback"):
        state["progress_callback"]("writer", "running")
        
    research_combined = (
        f"SEARCH RESULTS : \n{state['search_result']}\n\n"
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
        print(f"\n Final Report (Revision {state.get('revision_count', 0)})\n", report)
        
    new_revision_count = state.get("revision_count", 0) + 1
    return {"report": report, "revision_count": new_revision_count}

def critic_node(state: AgentState):
    if state.get("progress_callback"):
        # Reset writer and critic status to pending/running for the frontend
        state["progress_callback"]("critic", "running")
        
    feedback = critic_chain.invoke({
         "report" : state["report"]
    })
    
    if state.get("progress_callback"):
        state["progress_callback"]("critic", "done")
        
    if state.get("verbose"):
        print("\n Critic Feedback\n", feedback)
        
    return {"feedback": feedback}

def should_continue(state: AgentState):
    score = extract_critic_score(state["feedback"])
    if state.get("verbose"):
        print(f"\n -> Critic Score extracted: {score}")
        
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
    initial_state = {
        "topic": topic,
        "search_result": "",
        "scraped_content": "",
        "report": "",
        "feedback": "",
        "revision_count": 0,
        "verbose": verbose,
        "progress_callback": progress_callback
    }
    
    final_state = app_workflow.invoke(initial_state)
    return final_state

if __name__ == "__main__":
    topic = input("\n Enter a research topic : ")
    def dummy_progress(step, status):
        print(f"[{step}] -> {status}")
    run_research_pipeline(topic, verbose=True, progress_callback=dummy_progress)
