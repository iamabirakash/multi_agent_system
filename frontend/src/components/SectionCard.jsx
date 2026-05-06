import { isValidElement } from "react";

const SectionCard = ({ title, accentClass = "bg-primary", children }) => {
  const content =
    isValidElement(children)
      ? children
      : typeof children === "string"
      ? children
      : children == null
      ? ""
      : typeof children === "object"
      ? JSON.stringify(children, null, 2)
      : String(children);

  return (
    <section className="glass-panel animate-floatIn rounded-2xl p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-4">
        <div className={`h-3 w-3 rounded-full shadow-[0_0_8px_currentColor] ${accentClass}`} />
        <h3 className="font-display text-xl font-bold tracking-wide text-textMain">{title}</h3>
      </div>
      <div className="text-[15px] leading-relaxed text-textMuted">{content}</div>
    </section>
  );
};

export default SectionCard;
