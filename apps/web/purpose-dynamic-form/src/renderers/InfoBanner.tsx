interface Props {
  text: string;
}

export function InfoBanner({ text }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-blue-50 px-4 py-3">
      <svg
        className="size-6 shrink-0 text-blue-500"
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
