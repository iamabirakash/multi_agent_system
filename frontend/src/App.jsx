import { useState } from "react";
import SectionCard from "./components/SectionCard";
import LoadingPanel from "./components/LoadingPanel";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const runResearch = async (event) => {
    event.preventDefault();

    if (topic.trim().length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

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
    } catch (err) {
      setError(err.message || "Unable to reach backend.");
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

      {loading && <LoadingPanel topic={topic} />}

      {result && (
        <div className="animate-floatIn">
          <SectionCard title="Final Report" accent="bg-ink">{result.report}</SectionCard>
        </div>
      )}
    </main>
  );
}

export default App;
