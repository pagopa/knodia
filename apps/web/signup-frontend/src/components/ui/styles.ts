import { tv } from "tailwind-variants";

export const focusRing = tv({
  base: "outline-primary-violet outline-offset-2 forced-colors:outline-[Highlight]",
  variants: {
    isFocusVisible: {
      false: "outline-0",
      true: "outline-2",
    },
  },
});

export const fieldErrorTextClass =
  "font-caption text-[14px] leading-[20px] text-status-error";
