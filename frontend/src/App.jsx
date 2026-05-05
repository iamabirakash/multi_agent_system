import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    let current = 0;
    setSteps((prev) =>
      prev.map((step, idx) => ({
        ...step,
        status: idx === 0 ? "running" : "pending",
      }))
    );

    const timer = setInterval(() => {
      current += 1;
      setSteps((prev) =>
        prev.map((step, idx) => {
          if (idx < current) {
            return { ...step, status: "done" };
          }
          if (idx === current) {
            return { ...step, status: "running" };
          }
          return { ...step, status: "pending" };
        })
      );
    }, 2200);

    return () => clearInterval(timer);
  }, [loading]);

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
      const response = await fetch(`${API_BASE}/api/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong while running the pipeline.");
      }

      setResult(data);
      setSteps((prev) => prev.map((step) => ({ ...step, status: "done" })));
    } catch (err) {
      setError(err.message || "Unable to reach backend.");
      setSteps(baseSteps);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 md:px-8 md:py-12">
      <div className="mb-8 animate-floatIn rounded-3xl border border-white/70 bg-white/60 p-6 shadow-card md:p-8">
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-teal">Multi Agent System</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink md:text-5xl">Research Forge</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink/75 md:text-base">
          Enter a topic and let your Search, Reader, Writer, and Critic agents collaborate into one polished research output.
        </p>

        <form onSubmit={runResearch} className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Impact of AI on software engineering jobs in 2026"
            className="w-full rounded-xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-ember"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Running..." : "Generate Report"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
      </div>

      {loading && <LoadingPanel topic={topic} steps={steps} />}

      {result && (
        <div className="animate-floatIn">
          <SectionCard title="Final Report" accent="bg-ink">
            <article className="prose prose-stone max-w-none prose-headings:font-display prose-headings:font-extrabold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-[15px] prose-p:leading-7 prose-strong:text-ink prose-strong:font-extrabold prose-li:my-1 prose-a:font-bold prose-a:text-teal prose-a:underline prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:text-ember">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report}</ReactMarkdown>
            </article>
          </SectionCard>
        </div>
      )}
    </main>
  );
}

export default App;
