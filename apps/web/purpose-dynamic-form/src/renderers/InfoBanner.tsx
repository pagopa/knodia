interface Props {
  text: string;
  variant?: "error" | "info" | "warning";
}

export function InfoBanner({ text, variant = "info" }: Props) {
  const colorClasses = {
    error: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
    warning: "bg-yellow-50 text-yellow-700",
  };

  return (
    <div
      className={`flex items-center gap-4 rounded-lg px-4 py-3 ${colorClasses[variant]}`}
    >
      <svg
        className={"size-6 shrink-0"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="16" y2="12" />
        <line x1="12" x2="12.01" y1="8" y2="8" />
      </svg>
      <p className="text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
