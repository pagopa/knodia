import type { ProgressBarProps } from "react-aria-components";

import { composeRenderProps, Label, ProgressBar } from "react-aria-components";
import { twMerge } from "tailwind-merge";

interface LoaderProps extends ProgressBarProps {
  label?: string;
  size?: number;
}

export function Loader({
  label,
  size,
  isIndeterminate = true,
  ...props
}: LoaderProps) {
  // SVG strokes are centered, so subtract half the stroke width from the radius to create an inner stroke.
  const strokeWidth = 4;
  const radius = `calc(50% - ${strokeWidth / 2}px)`;

  return (
    <ProgressBar
      isIndeterminate={isIndeterminate}
      {...props}
      className={composeRenderProps(props.className, (className) =>
        twMerge("w-60 flex flex-col items-center justify-center", className),
      )}
    >
      {({ percentage, isIndeterminate }) => (
        <>
          <svg
            fill="none"
            height={size || 56}
            viewBox="0 0 32 32"
            width={size || 56}
          >
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="var(--color-secondary-light)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="50%"
              cy="50%"
              // Normalize the path length to 100 so we can easily set stroke-dashoffset to a percentage.
              pathLength="100"
              r={radius}
              stroke="var(--color-brand-dark)"
              // Add extra gap between dashes so 0% works in Chrome.
              strokeDasharray="100 200"
              strokeDashoffset={
                100 - (isIndeterminate || percentage == null ? 25 : percentage)
              }
              strokeLinecap="round"
              strokeWidth={strokeWidth}
              style={{
                rotate: "-90deg",
                transformOrigin: "center center",
              }}
            >
              {isIndeterminate && (
                <animateTransform
                  attributeName="transform"
                  dur="0.75s"
                  repeatCount="indefinite"
                  type="rotate"
                  values="0;360"
                />
              )}
            </circle>
          </svg>
          {label && (
            <Label className="text-primary-light-mid-contrast body-md mt-6">
              {label}
            </Label>
          )}
        </>
      )}
    </ProgressBar>
  );
}
