interface IconProps {
  className?: string;
}

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function ArrowForwardIcon({ className = "size-6" }: IconProps) {
  return (
    <svg
      aria-hidden
      className={`fill-current ${className}`}
      viewBox="0 -960 960 960"
    >
      <path d="M686-450H160v-60h526L438-758l42-42 320 320-320 320-42-42 248-248Z" />
    </svg>
  );
}
