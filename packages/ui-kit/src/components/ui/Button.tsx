import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing } from "../../libs/react-aria";

export interface ButtonProps extends RACButtonProps {
  /** @default 'brand' */
  hierarchy?: "brand" | "danger" | "neutral";
  /** @default 'filled' */
  kind?: "elevated" | "filled" | "ghost" | "outlined" | "tonal";
  /** @default 'md' */
  size?: "lg" | "md" | "sm";
}

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = tv({
  extend: focusRing,
  base: "relative inline-flex items-center justify-center gap-2 border box-border py-0 text-sm font-semibold text-center transition rounded-lg [-webkit-tap-highlight-color:transparent] leading-[1.6]",
  variants: {
    kind: {
      filled: "border-transparent",
      outlined: "bg-white",
      tonal: "border-transparent",
      ghost: "bg-transparent border-transparent",
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
      class:
        "bg-primary-700 hover:bg-primary-800 pressed:bg-primary-800 text-white",
    },
    {
      kind: "filled",
      hierarchy: "danger",
      class:
        "bg-danger-600 hover:bg-danger-700 pressed:bg-danger-700 text-white",
    },
    {
      kind: "filled",
      hierarchy: "neutral",
      class:
        "bg-neutral-700 text-white hover:bg-neutral-800 pressed:bg-neutral-800",
    },

    // --- OUTLINED buttons ---
    {
      kind: "outlined",
      hierarchy: "brand",
      class:
        "border-primary-200 text-primary-700 hover:bg-primary-50 pressed:bg-primary-50",
    },
    {
      kind: "outlined",
      hierarchy: "danger",
      class:
        "border-danger-200 text-danger-600 hover:bg-danger-50 pressed:bg-danger-50",
    },
    {
      kind: "outlined",
      hierarchy: "neutral",
      class:
        "border-neutral-200 text-neutral-700 hover:bg-neutral-50 pressed:bg-neutral-50",
    },

    // --- TONAL buttons ---
    {
      kind: "tonal",
      hierarchy: "brand",
      class:
        "bg-primary-50 hover:bg-primary-100 pressed:bg-primary-100 text-primary-700",
    },
    {
      kind: "tonal",
      hierarchy: "danger",
      class:
        "bg-danger-50 hover:bg-danger-100 pressed:bg-danger-100 text-danger-600",
    },
    {
      kind: "tonal",
      hierarchy: "neutral",
      class:
        "bg-neutral-50 hover:bg-neutral-100 pressed:bg-neutral-100 text-neutral-700",
    },

    // --- GHOST buttons ---
    {
      kind: "ghost",
      hierarchy: "brand",
      class: "text-primary-700 hover:bg-primary-50 pressed:bg-primary-50",
    },
    {
      kind: "ghost",
      hierarchy: "danger",
      class: "text-danger-600 hover:bg-danger-50 pressed:bg-danger-50",
    },
    {
      kind: "ghost",
      hierarchy: "neutral",
      class: "text-neutral-700 hover:bg-neutral-50 pressed:bg-neutral-50",
    },

    // --- ELEVATED buttons ---
    {
      kind: "elevated",
      hierarchy: "brand",
      class: "text-primary-700 hover:bg-primary-50 pressed:bg-primary-50",
    },
    {
      kind: "elevated",
      hierarchy: "danger",
      class: "text-danger-600 hover:bg-danger-50 pressed:bg-danger-50",
    },
    {
      kind: "elevated",
      hierarchy: "neutral",
      class: "text-neutral-700 hover:bg-neutral-50 pressed:bg-neutral-50",
    },
  ],
});

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
