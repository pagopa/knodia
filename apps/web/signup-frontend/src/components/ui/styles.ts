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

export const buttonStyles = tv({
  base: "box-border inline-flex h-(--button-height) items-center justify-center gap-(--button-gap) rounded-button px-(--button-padding-x) py-3 font-body text-button-md leading-button-md font-medium transition hover:cursor-pointer",
  defaultVariants: {
    variant: "primary",
  },
  extend: focusRing,
  variants: {
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
    variant: {
      primary:
        "bg-primary-violet text-neutral-white hover:bg-primary-violet-hover",
      secondary:
        "border-(length:--border-button) border-primary-violet bg-transparent text-primary-violet hover:border-primary-violet-hover hover:text-primary-violet-hover",
      text: "h-auto px-0 py-0 text-primary-violet hover:text-primary-violet-hover",
    },
  },
});
