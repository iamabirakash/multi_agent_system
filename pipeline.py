from agents import build_search_agent, build_reader_agent, writer_chain, critic_prompt
def run_research_pipeline(topic : str) -> dict:
    state = {}

    # Search Agent Working
    print("\n" + "="*50)
    print("Step 1: Search Agent Gathering Information")
    print("="*50)

    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user",f"Find recent and reliable information on the topic: {topic}")]
    })

    state["search_result"] = search_result['messages'][-1].content

    print("\n Search Result:",state["search_result"])