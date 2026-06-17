interface ChipProps {
  children: React.ReactNode;
}

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function Chip({ children }: ChipProps) {
  return (
    <span className="text-style-small inline-flex h-8 items-center justify-center rounded-chip bg-secondary-soft-quartz px-2 text-deep-violet">
      {children}
    </span>
  );
}
