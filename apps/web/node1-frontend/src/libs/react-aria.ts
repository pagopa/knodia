import { composeRenderProps } from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

export const focusRing = tv({
  base: "outline outline-primary-600 dark:outline-primary-500 forced-colors:outline-[Highlight] outline-offset-2",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
});

export function composeTailwindRenderProps<T>(
  className: ((v: T) => string) | string | undefined,
  tw: string,
): ((v: T) => string) | string {
  return composeRenderProps(className, (className) => twMerge(tw, className));
}

export const fieldBorderStyles = tv({
  base: "transition",
  variants: {
    isFocusWithin: {
      false:
        "border-neutral-300 hover:border-neutral-400 dark:border-neutral-600 dark:hover:border-neutral-500 forced-colors:border-[ButtonBorder]",
      true: "border-neutral-600 dark:border-neutral-300 forced-colors:border-[Highlight]",
    },
    isInvalid: {
      true: "border-red-600 dark:border-red-600 forced-colors:border-[Mark]",
    },
    isDisabled: {
      true: "border-neutral-200 dark:border-neutral-700 forced-colors:border-[GrayText]",
    },
  },
});

export const fieldGroupStyles = tv({
  base: "group flex items-center h-9 box-border bg-white dark:bg-neutral-900 forced-colors:bg-[Field] border rounded-lg overflow-hidden transition",
  extend: focusRing,
  variants: fieldBorderStyles.variants,
});
