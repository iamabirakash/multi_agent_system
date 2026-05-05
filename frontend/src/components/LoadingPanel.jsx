import { useMemo } from "react";

const LoadingPanel = ({ topic }) => {
  const steps = useMemo(
    () => [
      "Searching trustworthy sources",
      "Scraping most relevant article",
      "Writing structured research report",
      "Generating critic feedback",
    ],
    []
  );

  return (
    <div className="glass animate-floatIn rounded-2xl border border-white/60 p-6 shadow-card">
      <h3 className="font-display text-xl font-bold text-ink">Research in progress</h3>
      <p className="mt-1 text-sm text-ink/70">Topic: {topic}</p>
      <div className="mt-5 space-y-3">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-3 text-sm text-ink/80">
            <span
              className="h-2.5 w-2.5 animate-pulse rounded-full bg-ember"
              style={{ animationDelay: `${idx * 120}ms` }}
            />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingPanel;
