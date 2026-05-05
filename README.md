# MultiAgentSystem

A multi-agent research assistant that uses Gemini + LangChain to generate long-form reports from live web research.

It includes:
- A Python backend with agent pipeline orchestration
- A FastAPI API for async job execution and step-by-step status tracking
- A React + Tailwind frontend for prompt input, live progress, markdown rendering, and report downloads

## Features

- Multi-agent workflow:
  - Search Agent (finds relevant sources)
  - Reader Agent (scrapes deeper content)
  - Writer Chain (produces final report)
  - Critic Chain (quality evaluation in backend)
- Real-time pipeline progress in UI (`pending` -> `running` -> `done` per step)
- Markdown-styled long-form output
- Download final report as `.md` or `.txt`

## Project Structure

```text
MultiAgentSystem/
+- agents.py                  # LLM setup + search/reader agents + writer/critic chains
+- tools.py                   # Tavily search + URL scraping tools
+- pipeline.py                # Multi-step research pipeline orchestration
+- app.py                     # FastAPI backend + async job status endpoints
+- requirements.txt           # Python dependencies
+- frontend/
   +- src/
   ¦  +- App.jsx              # Main UI + polling + downloads
   ¦  +- components/
   ¦     +- LoadingPanel.jsx
   ¦     +- SectionCard.jsx
   +- package.json            # Frontend dependencies/scripts
   +- tailwind.config.js
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Environment Variables

Create a `.env` file in project root:

```env
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
```

## Backend Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend runs at:
- `http://127.0.0.1:8000`

Health check:
- `GET /health`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:
- `http://localhost:5173`

## API Endpoints

### 1) Start research job

`POST /api/research/start`

Request body:

```json
{
  "topic": "Impact of AI on software engineering jobs in 2026"
}
```

Response:

```json
{
  "job_id": "<uuid>"
}
```

### 2) Get job status/result

`GET /api/research/{job_id}`

Response includes:
- `status` (`running`, `done`, `error`)
- `steps` with per-step status
- `report` when finished

## Common Commands

From project root:

```bash
# Backend
uvicorn app:app --reload

# Frontend
cd frontend
npm run dev
```

## Troubleshooting

- `Import "langchain_google_genai" could not be resolved`
  - Ensure backend venv is active and run `pip install -r requirements.txt`

- Frontend cannot connect to backend
  - Make sure backend is running on `127.0.0.1:8000`
  - Verify CORS origin is `http://localhost:5173`

- Empty or short reports
  - Check both API keys in `.env`
  - Try a more specific topic for richer source retrieval

## Notes

- Do not commit real API keys.
- Rotate keys immediately if they were exposed.
