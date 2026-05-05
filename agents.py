from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search, scrape_url
from dotenv import load_dotenv

load_dotenv()

#model setup for the llm using gpt-4o-mini for cost efficiency and good performance, with temperature 0 for deterministic responses
llm = ChatOpenAI(model="gpt-4o-mini",temperature=0)

# First agent
def build_search_agent():
    return create_agent(
        model = llm,
        tools = [web_search]
    )

# Second agent
def build_reader_agent():
    return create_agent(
        model = llm,
        tools = [scrape_url]
    )

# Writer Chain
writer_prompt = ChatPromptTemplate.from_messages([
    ("system","You are an expert research writer. Write clear,structured and insightful reports."),
    ("human","""Write a detailed research report on the topic's below.
     Topic: {topic}
     Research Gathered:
     {research}
     Structure the report as:
     -Introduction
     -Key Findings(minimum 3 well explained points)
     -Conclusion
     -Sources(Include all URLs used for research)
     Be detailed, factual and professional.""")
])

#from left to right: format prompt, send to llm, parse output as string
writer_chain = writer_prompt | llm | StrOutputParser()

# Critic Chain
critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

    Report:
    {report}
    Respond in this exact format:
    Score: X/10
    Strengths:
    - ...
    - ...
    Areas to Improve:
    - ...
    - ...
    One line verdict:
    ..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()