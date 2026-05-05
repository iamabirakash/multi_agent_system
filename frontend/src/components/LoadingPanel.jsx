const LoadingPanel = ({ topic, steps }) => {
  const getStepStyle = (status) => {
    if (status === "done") {
      return "bg-teal";
    }
    if (status === "running") {
      return "bg-ember animate-pulse";
    }
    return "bg-ink/20";
  };

  return (
    <div className="glass animate-floatIn rounded-2xl border border-white/60 p-6 shadow-card">
      <h3 className="font-display text-xl font-bold text-ink">Research in progress</h3>
      <p className="mt-1 text-sm text-ink/70">Topic: {topic}</p>
      <div className="mt-5 space-y-3">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center justify-between gap-3 text-sm text-ink/80">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${getStepStyle(step.status)}`} />
              <span>{step.label}</span>
            </div>
            <span className="font-semibold capitalize text-ink/70">{step.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingPanel;
