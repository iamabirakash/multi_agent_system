from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tools import web_search, scrape_url
from dotenv import load_dotenv
import os

load_dotenv()

# Use an env-driven model so deployment changes do not require code edits.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-lite")

# model setup for the llm using a Gemini Flash variant for cost efficiency and latency
llm = ChatGoogleGenerativeAI(
    model=GEMINI_MODEL,
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
Always produce long-form output unless data is insufficient.
Use citation tags like [S1], [S2] that map to provided source IDs."""),
    ("human","""Write a detailed research report on the topic below.
     Topic: {topic}
     Research Gathered:
     {research}
     
     {feedback_instruction}

     Requirements:
     - Target length: 2200-3200 words.
     - Use markdown headings and subheadings.
     - Include a strong Introduction with context, scope, and background (minimum 3 substantial paragraphs).
     - Include at least 7 Key Findings with detailed explanation.
     - For each finding, only if necessary include:
       - What happened / what it means
       - Why it matters
       - Risks, trade-offs, or uncertainty
     - Add a Comparative/Trend Analysis section with clear contrasts over time or across stakeholders (minimum 3 substantial paragraphs).
     - Add an Actionable Takeaways section with detailed recommendations for multiple audiences (consumers, enterprises, and investors/policymakers where relevant).
     - Add a Conclusion that synthesizes major insights (minimum 2 substantial paragraphs).
     - Expand depth with concrete examples, mechanisms, and second-order effects; avoid short bullet-only explanations.
     - Every factual claim should include source tags where relevant, e.g. [S1] or [S2][S3].
     - End with a Sources section and include real URLs from provided sources.
     - Do not invent sources, URLs, or source IDs.
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

def extract_critic_score(feedback: str) -> float:
    import re
    match = re.search(r"Score:\s*([\d.]+)", feedback, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 10.0  # default to pass if we can't parse
