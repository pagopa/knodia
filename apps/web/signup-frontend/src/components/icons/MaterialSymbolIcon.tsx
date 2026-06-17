export interface IconProps {
  className?: string;
}

interface MaterialSymbolIconProps extends IconProps {
  d: string;
}

export function MaterialSymbolIcon({
  className = "size-6",
  d,
}: MaterialSymbolIconProps) {
  return (
    <svg
      aria-hidden
      className={`fill-current ${className}`}
      viewBox="0 -960 960 960"
    >
      <path d={d} />
    </svg>
  );
}
