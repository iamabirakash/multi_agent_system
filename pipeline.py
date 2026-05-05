from agents import build_search_agent, build_reader_agent, writer_chain, critic_prompt

def run_research_pipeline(topic : str) -> dict:
    state = {}

    # Step 1 - Search Agent Working
    print("\n" + "="*50)
    print("Step 1: Search Agent Gathering Information")
    print("="*50)

    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user",f"Find recent and reliable information on the topic: {topic}")]
    })

    state["search_result"] = search_result['messages'][-1].content

    print("\n Search Result:",state["search_result"])

    # Step 2 - Reader Agent Working
    print("\n" + "="*50)
    print("Step 2: Reader Agent Analyzing Information")
    print("="*50)

    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [("user",
            f"Based on the following search results about '{topic}', "
            f"pick the most relevant URL and scrape it for deeper content.\n\n"
            f"Search Results:\n{state['search_results'][:800]}"
        )]
    })

    state['scraped_content'] = reader_result['messages'][-1].content

    print("\n Scraped Content:",state["scraped_content"])