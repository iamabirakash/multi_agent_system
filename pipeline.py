from agents import build_search_agent, build_reader_agent, writer_chain, critic_chain


def run_research_pipeline(topic: str, verbose: bool = True, progress_callback=None) -> dict:
    state = {}

    # Step 1 - Search Agent Working
    if progress_callback:
        progress_callback("search", "running")
    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user",f"Find recent and reliable information on the topic: {topic}")]
    })

    state["search_result"] = search_result['messages'][-1].content
    if progress_callback:
        progress_callback("search", "done")

    if verbose:
        print("\n Search Result:", state["search_result"])

    # Step 2 - Reader Agent Working
    if progress_callback:
        progress_callback("reader", "running")
    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [("user",
            f"Based on the following search results about '{topic}', "
            f"pick the most relevant URL and scrape it for deeper content.\n\n"
            f"Search Results:\n{state['search_result']}"
        )]
    })

    state['scraped_content'] = reader_result['messages'][-1].content
    if progress_callback:
        progress_callback("reader", "done")

    # Step 3 - Writer Agent Working
    if progress_callback:
        progress_callback("writer", "running")
    research_combined = (
        f"SEARCH RESULTS : \n{state['search_result']}\n\n"
        f"DETAILED SCRAPED CONTENT : \n{state['scraped_content']}"
    )

    state["report"] = writer_chain.invoke({
        "topic": topic,
        "research": research_combined
    })
    if progress_callback:
        progress_callback("writer", "done")

    if verbose:
        print("\n Final Report\n", state["report"])

    # Step 4 - Critic Agent Working
    if progress_callback:
        progress_callback("critic", "running")
    state["feedback"] = critic_chain.invoke({
         "report" : state["report"]
    })
    if progress_callback:
        progress_callback("critic", "done")

    if verbose:
        print("\n Critic Feedback\n", state["feedback"])

    return state

if __name__ == "__main__":
    topic = input("\n Enter a research topic : ")
    run_research_pipeline(topic)
