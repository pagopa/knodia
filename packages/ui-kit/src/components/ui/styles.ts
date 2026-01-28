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
  extend: focusRing,
  base: "border-primary-light-decorative box-border w-full rounded-lg border px-3 text-sm leading-[1.6] transition",
  variants: {
    isInvalid: {
      true: "",
      false: "",
    },
    isFocused: {
      true: "",
      false: "",
    },
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

export const listItemStyles = tv({
  extend: focusRing,
  base: "group body-md relative flex w-full items-center gap-3 rounded-md px-4 py-3 will-change-transform forced-color-adjust-none select-none [&_svg]:size-5 [&_svg]:shrink-0",
  variants: {
    isDisabled: { true: "", false: "" },
    isSelected: { true: "", false: "" },
  },
  compoundVariants: [
    {
      isDisabled: true,
      className:
        "text-primary-light-decorative [&_svg]:text-primary-light-decorative bg-transparent",
    },
    {
      isDisabled: false,
      isSelected: true,
      className:
        "bg-brand-light text-primary-light-mid-contrast [&_svg]:text-primary-light-low-contrast -outline-offset-4 outline-white [&+[data-selected]]:rounded-t-none [&:has(+[data-selected])]:rounded-b-none",
    },
    {
      isDisabled: false,
      isSelected: false,
      className:
        "pressed:bg-slate-100 text-primary-light-mid-contrast [&_svg]:text-primary-light-low-contrast -outline-offset-2 hover:bg-slate-100",
    },
  ],
});

export const buttonStyles = tv({
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
        "border-brand-200 text-brand-700 hover:bg-brand-50 pressed:bg-brand-50",
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
        "bg-brand-50 hover:bg-brand-100 pressed:bg-brand-100 text-brand-700",
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
      class: "text-brand-700 hover:bg-brand-50 pressed:bg-brand-50",
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
      class: "text-brand-700 hover:bg-brand-50 pressed:bg-brand-50",
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
