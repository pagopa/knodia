import { composeRenderProps } from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

export const focusRing = tv({
  base: "outline-primary-600 dark:outline-primary-500 outline outline-offset-2 forced-colors:outline-[Highlight]",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
});

export const fieldInputStyle = tv({
  base: "border-primary-light-decorative box-border w-full rounded-lg border-1 px-3 text-sm leading-[1.6] transition",
  variants: {
    isReadOnly: {
      true: "bg-secondary-light border-primary-light-decorative cursor-default",
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
  },
  compoundVariants: [
    {
      isInvalid: true,
      isFocused: true,
      isReadOnly: false,
      isDisabled: false,
      class: "border-error-light-low-contrast",
    },
    {
      isInvalid: true,
      isFocused: false,
      isReadOnly: false,
      isDisabled: false,
      class: "border-error-light-decorative",
    },
    {
      isInvalid: false,
      isFocused: true,
      isReadOnly: false,
      isDisabled: false,
      class: "border-primary-low-contrast",
    },
  ],
});

export function composeTailwindRenderProps<T>(
  className: ((v: T) => string) | string | undefined,
  tw: string,
): ((v: T) => string) | string {
  return composeRenderProps(className, (className) => twMerge(tw, className));
}
