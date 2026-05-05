import { isValidElement } from "react";

const SectionCard = ({ title, accent, children }) => {
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
    <section className="glass animate-floatIn rounded-2xl border border-white/60 p-5 shadow-card md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      </div>
      <div className="text-sm leading-7 text-ink/90">{content}</div>
    </section>
  );
};

export default SectionCard;
