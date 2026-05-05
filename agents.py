from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search, scrape_url
from dotenv import load_dotenv

load_dotenv()

#model setup for the llm using gemini-2.0-flash for cost efficiency and good performance, with temperature 0 for deterministic responses
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite-preview",
    temperature=0,
    max_output_tokens=4096,
)

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
    ("system","""You are an expert research writer.
Write deep, structured, and insight-rich reports with strong factual grounding.
Always produce long-form output unless data is insufficient."""),
    ("human","""Write a detailed research report on the topic below.
     Topic: {topic}
     Research Gathered:
     {research}
     Requirements:
     - Target length: 1200-1800 words.
     - Use markdown headings and subheadings.
     - Include a strong Introduction with context and scope.
     - Include at least 5 Key Findings with detailed explanation.
     - For each finding, include:
       - What happened / what it means
       - Why it matters
       - Risks, trade-offs, or uncertainty
     - Add a Comparative/Trend Analysis section.
     - Add an Actionable Takeaways section.
     - Add a Conclusion that synthesizes major insights.
     - End with a Sources section and include all URLs used.
     - Keep tone factual, professional, and specific; avoid vague generic statements.""")
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
