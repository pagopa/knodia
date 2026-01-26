import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "../../libs/react-aria";

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = tv({
  extend: focusRing,
  base: "body-md-em relative box-border inline-flex items-center justify-center gap-2 rounded-lg border py-0 text-center transition [-webkit-tap-highlight-color:transparent]",
  variants: {
    kind: {
      filled: "border-transparent",
      outlined: "bg-white",
      tonal: "border-transparent",
      ghost: "border-transparent bg-transparent",
      elevated:
        "border border-neutral-100 bg-white shadow-[0_2px_4px_var(--shadow-color)]",
    },
    hierarchy: {
      brand: "",
      danger: "",
      neutral: "",
    },
    size: {
      sm: "h-8 px-2",
      md: "h-9 px-3",
      lg: "h-10 px-4",
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
  },
  defaultVariants: {
    hierarchy: "brand",
    kind: "filled",
    size: "md",
  },
  compoundVariants: [
    // --- FILLED buttons ---
    {
      kind: "filled",
      hierarchy: "brand",
      class: "bg-brand-700 hover:bg-brand-800 pressed:bg-brand-800 text-white",
    },
    {
      kind: "filled",
      hierarchy: "danger",
      class: "bg-error-600 hover:bg-error-700 pressed:bg-error-700 text-white",
    },
    {
      kind: "filled",
      hierarchy: "neutral",
      class:
        "pressed:bg-neutral-800 bg-neutral-700 text-white hover:bg-neutral-800",
    },

    // --- OUTLINED buttons ---
    {
      kind: "outlined",
      hierarchy: "brand",
      class:
        "border-primary-200 text-primary-700 hover:bg-brand-50 pressed:bg-brand-50",
    },
    {
      kind: "outlined",
      hierarchy: "danger",
      class:
        "border-error-200 text-error-600 hover:bg-error-50 pressed:bg-error-50",
    },
    {
      kind: "outlined",
      hierarchy: "neutral",
      class:
        "pressed:bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-50",
    },

    // --- TONAL buttons ---
    {
      kind: "tonal",
      hierarchy: "brand",
      class:
        "bg-brand-50 hover:bg-brand-100 pressed:bg-brand-100 text-primary-700",
    },
    {
      kind: "tonal",
      hierarchy: "danger",
      class:
        "bg-error-50 hover:bg-error-100 pressed:bg-error-100 text-error-600",
    },
    {
      kind: "tonal",
      hierarchy: "neutral",
      class:
        "pressed:bg-neutral-100 bg-neutral-50 text-neutral-700 hover:bg-neutral-100",
    },

    // --- GHOST buttons ---
    {
      kind: "ghost",
      hierarchy: "brand",
      class: "text-primary-700 hover:bg-brand-50 pressed:bg-brand-50",
    },
    {
      kind: "ghost",
      hierarchy: "danger",
      class: "text-error-600 hover:bg-error-50 pressed:bg-error-50",
    },
    {
      kind: "ghost",
      hierarchy: "neutral",
      class: "pressed:bg-neutral-50 text-neutral-700 hover:bg-neutral-50",
    },

    // --- ELEVATED buttons ---
    {
      kind: "elevated",
      hierarchy: "brand",
      class: "text-primary-700 hover:bg-brand-50 pressed:bg-brand-50",
    },
    {
      kind: "elevated",
      hierarchy: "danger",
      class: "text-error-600 hover:bg-error-50 pressed:bg-error-50",
    },
    {
      kind: "elevated",
      hierarchy: "neutral",
      class: "pressed:bg-neutral-50 text-neutral-700 hover:bg-neutral-50",
    },
  ],
});

export type ButtonProps = ButtonVariants & RACButtonProps;

type ButtonVariants = VariantProps<typeof buttonVariants>;

export function Button({
  hierarchy,
  kind,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonVariants({
          ...renderProps,
          className,
          hierarchy,
          kind,
          size,
        }),
      )}
    >
      {children}
    </RACButton>
  );
}
