import {
  composeRenderProps,
  ProgressBar,
  type ProgressBarProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

const loaderStyles = tv({
  base: "flex flex-col items-center justify-center gap-4",
});

interface LoaderProps extends ProgressBarProps {
  label?: string;
  size?: number;
}

export function Loader({ label, size = 32, ...props }: LoaderProps) {
  return (
    <ProgressBar
      aria-label={label ?? "Loading"}
      isIndeterminate
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        loaderStyles({ ...renderProps, className }),
      )}
    >
      <svg
        className="animate-spin stroke-primary-violet"
        fill="none"
        height={size}
        viewBox="0 0 32 32"
        width={size}
      >
        <circle
          cx="16"
          cy="16"
          r="14"
          strokeDasharray="66 22"
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      {label && (
        <span className="font-body text-[16px] leading-[24px] text-neutral-medium-gray">
          {label}
        </span>
      )}
    </ProgressBar>
  );
}
