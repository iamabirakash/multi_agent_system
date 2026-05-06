const LoadingPanel = ({ topic, steps }) => {
  const getStepIndicator = (status) => {
    if (status === "done") {
      return "bg-secondary shadow-[0_0_10px_#4af8e3]";
    }
    if (status === "running") {
      return "bg-primary animate-pulseGlow shadow-[0_0_15px_#c799ff]";
    }
    return "bg-white/20";
  };

  const getStepText = (status) => {
    if (status === "done") return "text-secondary font-semibold";
    if (status === "running") return "text-primary font-bold";
    return "text-textMuted";
  };

  return (
    <div className="glass-panel animate-floatIn mb-8 rounded-2xl p-6 md:p-8">
      <div className="mb-6 border-b border-white/10 pb-4">
        <h3 className="font-display text-xl font-bold text-textMain">Agent Sequence Active</h3>
        <p className="mt-2 text-sm text-textMuted flex items-center gap-2">
          <span className="text-primary animate-pulse">⟚</span> Target: <span className="text-white">{topic}</span>
        </p>
      </div>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.label} className="glass-panel !bg-white/5 !shadow-none border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:bg-white/10">
            <div className="flex items-center gap-4">
              <span className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${getStepIndicator(step.status)}`} />
              <span className="font-medium tracking-wide text-textMain">{step.label}</span>
            </div>
            <span className={`text-xs uppercase tracking-wider ${getStepText(step.status)}`}>
              {step.status === "running" ? "Processing..." : step.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingPanel;
