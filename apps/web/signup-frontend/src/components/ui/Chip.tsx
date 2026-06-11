interface ChipProps {
  children: React.ReactNode;
}

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function Chip({ children }: ChipProps) {
  return (
    <span className="inline-flex h-8 items-center justify-center rounded-chip bg-secondary-soft-quartz px-2 font-body text-[16px] leading-[24px] font-medium text-deep-violet">
      {children}
    </span>
  );
}
