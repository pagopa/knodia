import { type HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** @default "sm" */
  size?: "md" | "sm";
  /** @default "secondary" */
  variant?: "destructive" | "primary" | "quiet" | "secondary";
}

const badge = tv({
  base: "inline-flex items-center gap-1 rounded-full border font-sans font-medium select-none [-webkit-tap-highlight-color:transparent] forced-colors:border-[ButtonBorder]",
  variants: {
    size: {
      sm: "px-2 py-0.5 text-xs leading-5",
      md: "px-2.5 py-0.5 text-sm leading-5",
    },
    variant: {
      destructive:
        "border-red-600 bg-red-600 text-white forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
      primary:
        "border-blue-600 bg-blue-600 text-white forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
      quiet:
        "border-neutral-200 bg-transparent text-neutral-700 dark:border-neutral-700 dark:text-neutral-300 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
      secondary:
        "border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
    },
  },
  defaultVariants: {
    size: "sm",
    variant: "secondary",
  },
});

export function Badge({ className, size, variant, ...props }: BadgeProps) {
  return <span {...props} className={badge({ className, size, variant })} />;
}
