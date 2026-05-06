import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SectionCard from "./components/SectionCard";
import LoadingPanel from "./components/LoadingPanel";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function App() {
  const baseSteps = useMemo(
    () => [
      { id: 1, label: "Searching trustworthy sources", status: "pending" },
      { id: 2, label: "Scraping most relevant article", status: "pending" },
      { id: 3, label: "Writing structured research report", status: "pending" },
      { id: 4, label: "Generating critic feedback", status: "pending" },
    ],
    []
  );

  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [steps, setSteps] = useState(baseSteps);

  const downloadReport = async (format) => {
    if (!result?.jobId) return;
    const response = await fetch(`${API_BASE}/api/research/${result.jobId}/export/${format}`);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Could not export report.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${result.topic || "research-report"}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const runResearch = async (event) => {
    event.preventDefault();

    if (topic.trim().length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSteps(baseSteps);

    try {
      const startResponse = await fetch(`${API_BASE}/api/research/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const startData = await startResponse.json();
      if (!startResponse.ok) {
        throw new Error(startData.detail || "Could not start the pipeline.");
      }

      const { job_id: jobId } = startData;
      let finalData = null;

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const statusResponse = await fetch(`${API_BASE}/api/research/${jobId}`);
        const statusData = await statusResponse.json();
        if (!statusResponse.ok) {
          throw new Error(statusData.detail || "Could not fetch pipeline status.");
        }

        setSteps(statusData.steps || baseSteps);

        if (statusData.status === "done") {
          finalData = statusData;
          break;
        }
        if (statusData.status === "error") {
          throw new Error(statusData.error || "Pipeline failed.");
        }
      }

      setResult({ jobId, topic: finalData.topic, report: finalData.report });
    } catch (err) {
      setError(err.message || "Unable to reach backend.");
      setSteps(baseSteps);
    } finally {
      setLoading(false);
    }
  };

  const stepIcons = [
    "🔍", "📄", "📝", "💬"
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-12 md:px-8 md:py-16">

      {/* Header */}
      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 md:p-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-0.5 w-6 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-medium uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Autonomous Intelligence
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-medium text-gray-900 dark:text-white tracking-tight mb-3">
          Research{" "}
          <span className="text-blue-600 dark:text-blue-400">Forge</span>
        </h1>

        <p className="text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl mb-8">
          Deploy a swarm of specialized AI agents to autonomously search, scrape, write, and critique comprehensive reports on any subject.
        </p>

        <form onSubmit={runResearch} className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-grow">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The impact of quantum computing on modern cryptography"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 pl-10 text-[14px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-medium text-white transition whitespace-nowrap"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Initiating…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l14 0" /><path d="M13 18l6 -6" /><path d="M13 6l6 6" />
                </svg>
                Deploy Agents
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Loading / Pipeline Steps */}
      {loading && (
        <div className="mb-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">
            Agent Pipeline
          </p>
          <div className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all
                  ${step.status === "done"
                    ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : step.status === "running"
                    ? "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                  }`}
              >
                <span className="text-base">{stepIcons[i]}</span>
                <span className="flex-1">{step.label}</span>
                {step.status === "done" && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {step.status === "running" && (
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
          {/* Result header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 px-8 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Synthesized Output
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">Export</span>
              {["md", "txt", "pdf", "docx"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => downloadReport(fmt).catch((e) => setError(e.message))}
                  className="rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                >
                  .{fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Report body */}
          <div className="px-8 py-8">
            <article className="prose prose-gray dark:prose-invert max-w-none
              prose-headings:font-medium prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg
              prose-p:text-[15px] prose-p:leading-7 prose-p:text-gray-600 dark:prose-p:text-gray-400
              prose-strong:text-gray-800 dark:prose-strong:text-gray-200
              prose-li:text-gray-600 dark:prose-li:text-gray-400
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-l-blue-400 prose-blockquote:not-italic prose-blockquote:text-gray-500
              prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-blue-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-50 dark:prose-pre:bg-white/5 prose-pre:border prose-pre:border-gray-100 dark:prose-pre:border-white/10
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report}</ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
