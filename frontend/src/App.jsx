import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SectionCard from "./components/SectionCard";
import LoadingPanel from "./components/LoadingPanel";

const API_BASE = "http://127.0.0.1:8000";

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

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-12 md:px-8 md:py-16 selection:bg-primary/30">
      
      {/* Header Section */}
      <div className="glass-panel animate-floatIn mb-10 rounded-3xl p-8 md:p-10 relative overflow-hidden">
        {/* Glow effect behind the header */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1.5 w-8 bg-secondary rounded-full shadow-[0_0_8px_#4af8e3]"></div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-secondary">
              Autonomous Intelligence
            </p>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-white md:text-6xl tracking-tight">
            Research <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Forge</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] text-textMuted leading-relaxed">
            Deploy a swarm of specialized AI agents to autonomously search, scrape, write, and critique comprehensive reports on any subject.
          </p>

          <form onSubmit={runResearch} className="mt-8 flex flex-col gap-4 md:flex-row relative">
            <div className="relative flex-grow">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The impact of quantum computing on modern cryptography"
                className="glass-input w-full rounded-xl px-5 py-4 pl-12 text-[15px]"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="glass-button rounded-xl px-8 py-4 font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Initiating...
                </span>
              ) : "Deploy Agents"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6e84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <p className="text-sm font-medium text-[#ff6e84]">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      {loading && <LoadingPanel topic={topic} steps={steps} />}

      {/* Results Section */}
      {result && (
        <div className="animate-floatIn" style={{ animationDelay: "0.2s" }}>
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => downloadReport("md").catch((e) => setError(e.message))}
              className="glass-button-secondary rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Save as .md
            </button>
            <button
              type="button"
              onClick={() => downloadReport("txt").catch((e) => setError(e.message))}
              className="glass-button-secondary rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Save as .txt
            </button>
            <button
              type="button"
              onClick={() => downloadReport("pdf").catch((e) => setError(e.message))}
              className="glass-button-secondary rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18v16H3z"></path><path d="m8 10 2 2-2 2"></path><path d="M13 14h3"></path></svg>
              Save as .pdf
            </button>
            <button
              type="button"
              onClick={() => downloadReport("docx").catch((e) => setError(e.message))}
              className="glass-button-secondary rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 15l1.5-3L12 15l1.5-3L15 15"></path></svg>
              Save as .docx
            </button>
          </div>
          
          <SectionCard title="Synthesized Output" accentClass="bg-primary">
            {/* 
              Tailwind Typography needs dark mode modifiers (prose-invert) 
              since we are using a dark theme. 
            */}
            <article className="prose prose-invert prose-stone max-w-none 
              prose-headings:font-display prose-headings:font-bold prose-headings:text-white
              prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h3:text-xl 
              prose-p:text-[15px] prose-p:leading-8 prose-p:text-textMuted
              prose-strong:text-white prose-strong:font-bold 
              prose-li:my-2 prose-li:text-textMuted
              prose-a:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:text-secondary hover:prose-a:underline
              prose-blockquote:border-l-primary prose-blockquote:bg-white/5 prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
              prose-code:text-secondary prose-code:bg-black/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report}</ReactMarkdown>
            </article>
          </SectionCard>
        </div>
      )}
    </main>
  );
}

export default App;
