from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any
import json
import threading
import uuid

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


STEP_LABELS = {
    "search": "Searching trustworthy sources",
    "reader": "Scraping most relevant article",
    "writer": "Writing structured research report",
    "critic": "Generating critic feedback",
}

JOBS = {}
JOBS_LOCK = threading.Lock()


def _initial_steps() -> list[dict]:
    return [
        {"key": "search", "label": STEP_LABELS["search"], "status": "pending"},
        {"key": "reader", "label": STEP_LABELS["reader"], "status": "pending"},
        {"key": "writer", "label": STEP_LABELS["writer"], "status": "pending"},
        {"key": "critic", "label": STEP_LABELS["critic"], "status": "pending"},
    ]


def _set_step_status(job_id: str, step_key: str, status: str) -> None:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return
        for step in job["steps"]:
            if step["key"] == step_key:
                step["status"] = status
                break


def _run_job(job_id: str, topic: str) -> None:
    def progress_callback(step_key: str, status: str) -> None:
        _set_step_status(job_id, step_key, status)

    try:
        result = run_research_pipeline(topic, verbose=False, progress_callback=progress_callback)
        with JOBS_LOCK:
            if job_id in JOBS:
                JOBS[job_id]["status"] = "done"
                JOBS[job_id]["report"] = _to_text(result.get("report", ""))
                for step in JOBS[job_id]["steps"]:
                    step["status"] = "done"
    except Exception as exc:
        with JOBS_LOCK:
            if job_id in JOBS:
                JOBS[job_id]["status"] = "error"
                JOBS[job_id]["error"] = f"Pipeline failed: {exc}"


@app.post("/api/research/start")
def start_research(payload: ResearchRequest) -> dict:
    job_id = str(uuid.uuid4())
    with JOBS_LOCK:
        JOBS[job_id] = {
            "job_id": job_id,
            "topic": payload.topic,
            "status": "running",
            "steps": _initial_steps(),
            "report": "",
            "error": "",
        }
    thread = threading.Thread(target=_run_job, args=(job_id, payload.topic), daemon=True)
    thread.start()
    return {"job_id": job_id}


@app.get("/api/research/{job_id}")
def get_research_status(job_id: str) -> dict:
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")
        return {
            "job_id": job["job_id"],
            "topic": job["topic"],
            "status": job["status"],
            "steps": job["steps"],
            "report": job["report"],
            "error": job["error"],
        }
