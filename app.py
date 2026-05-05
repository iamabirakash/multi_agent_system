from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any
import json

from pipeline import run_research_pipeline


class ResearchRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=200)


app = FastAPI(title="Multi Agent Research API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


def _to_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        parts = []
        for item in value:
            parts.append(_to_text(item))
        return "\n".join(part for part in parts if part).strip()
    if isinstance(value, dict):
        if "text" in value and isinstance(value["text"], str):
            return value["text"]
        if "content" in value:
            return _to_text(value["content"])
        try:
            return json.dumps(value, ensure_ascii=False, indent=2)
        except Exception:
            return str(value)
    return str(value)


@app.post("/api/research")
def research(payload: ResearchRequest) -> dict:
    try:
        result = run_research_pipeline(payload.topic, verbose=False)
        return {
            "topic": payload.topic,
            "report": _to_text(result.get("report", "")),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {exc}") from exc
