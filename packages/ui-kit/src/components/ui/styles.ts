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
  base: "border-primary-light-decorative box-border w-full rounded-field border px-3 text-sm leading-[1.6] transition",
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

export const fieldBorderStyles = tv({
  variants: {
    isFocusWithin: {
      false: "border-primary-light-decorative",
      true: "border-primary-low-contrast",
    },
    isInvalid: {
      true: "border-error-light-decorative",
    },
    isDisabled: {
      true: "border-primary-light-decorative",
    },
  },
});

export const fieldGroupStyles = tv({
  extend: focusRing,
  base: "group flex h-10 items-center overflow-hidden rounded-field border bg-white",
  variants: fieldBorderStyles.variants,
});

export const dropdownStyles = tv({
  base: "outline-0 p-2 bg-white border border-primary-light-decorative rounded-dropdown shadow-dropdown flex flex-col gap-1 outline-hidden box-border max-h-[inherit] overflow-auto elevation-4",
});

// Shared by the single- and multi-select ComboBox field trigger.
export const fieldSizeStyles = tv({
  base: "px-3",
  variants: {
    size: {
      sm: "h-8",
      md: "h-10",
      lg: "h-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const fieldInputStyles = tv({
  base: "flex-1 min-w-0 body-md outline-none bg-transparent placeholder:text-primary-light-low-contrast",
});

// Drives the <Chip> component and any chip-shaped element that can't be built
// from it (e.g. the removable react-aria Tag in MultiSelectComboBox), so the
// two never drift.
export const chipStyles = tv({
  base: "label-md inline-flex items-center gap-x-0.5 rounded-chip px-3 py-1 [&>svg]:size-4 [&>svg]:shrink-0 h-6.25",
  variants: {
    kind: {
      neutral: "",
      brand: "",
      informative: "",
      success: "",
      warning: "",
      error: "",
    },
    type: {
      light: "",
      bright: "",
      dark: "",
    },
  },
  defaultVariants: {
    kind: "neutral",
    type: "bright",
  },
  compoundVariants: [
    {
      kind: "neutral",
      type: "light",
      class: "bg-secondary-light text-secondary-light-mid-contrast",
    },
    {
      kind: "neutral",
      type: "bright",
      class: "bg-secondary-light-decorative text-secondary-light-high-contrast",
    },
    {
      kind: "neutral",
      type: "dark",
      class: "bg-secondary-dark text-secondary-dark-mid-contrast",
    },
    {
      kind: "brand",
      type: "light",
      class: "bg-brand-light text-brand-light-mid-contrast",
    },
    {
      kind: "brand",
      type: "bright",
      class: "bg-brand-light-decorative text-brand-light-high-contrast",
    },
    {
      kind: "brand",
      type: "dark",
      class: "bg-brand-dark text-brand-dark-mid-contrast",
    },
    {
      kind: "informative",
      type: "light",
      class: "bg-info-light text-info-light-mid-contrast",
    },
    {
      kind: "informative",
      type: "bright",
      class: "bg-info-light-decorative text-info-light-high-contrast",
    },
    {
      kind: "informative",
      type: "dark",
      class: "bg-info-dark text-info-dark-mid-contrast",
    },
    {
      kind: "success",
      type: "light",
      class: "bg-success-light text-success-light-mid-contrast",
    },
    {
      kind: "success",
      type: "bright",
      class: "bg-success-light-decorative text-success-light-high-contrast",
    },
    {
      kind: "success",
      type: "dark",
      class: "bg-success-dark text-success-dark-mid-contrast",
    },
    {
      kind: "warning",
      type: "light",
      class: "bg-warning-light text-warning-light-mid-contrast",
    },
    {
      kind: "warning",
      type: "bright",
      class: "bg-warning-light-decorative text-warning-light-high-contrast",
    },
    {
      kind: "warning",
      type: "dark",
      class: "bg-warning-dark text-warning-dark-mid-contrast",
    },
    {
      kind: "error",
      type: "light",
      class: "bg-error-light text-error-light-mid-contrast",
    },
    {
      kind: "error",
      type: "bright",
      class: "bg-error-light-decorative text-error-light-high-contrast",
    },
    {
      kind: "error",
      type: "dark",
      class: "bg-error-dark text-error-dark-mid-contrast",
    },
  ],
});

export const listItemStyles = tv({
  extend: focusRing,
  base: "group body-md relative flex w-full items-center gap-3 rounded-list-item px-4 py-3 will-change-transform forced-color-adjust-none select-none [&_svg]:size-5 [&_svg]:shrink-0",
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
  base: "body-md-em relative box-border inline-flex items-center justify-center gap-2 rounded-button border py-0 text-center transition [-webkit-tap-highlight-color:transparent] hover:cursor-pointer",
  variants: {
    kind: {
      filled: "border-transparent",
      outlined: "bg-transparent",
      tonal: "border-transparent",
      ghost: "border-transparent bg-transparent",
      elevated: "border border-neutral-100 bg-white elevation-1",
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
      "icon-sm": "[&>svg]:h-5 [&>svg]:w-5 h-auto p-1.5",
      "icon-md": "[&>svg]:h-5 [&>svg]:w-5 h-auto p-2",
      "icon-lg": "[&>svg]:h-5 [&>svg]:w-5 h-auto p-2.5",
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
    isPending: {
      true: "opacity-30",
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
        "border-brand-200 text-brand-700 hover:border-brand-400 hover:bg-button-outlined-brand-bg-hover pressed:bg-brand-50",
    },
    {
      kind: "outlined",
      hierarchy: "danger",
      class:
        "border-error-200 text-error-600 hover:border-error-400 hover:bg-error-50 pressed:bg-error-50",
    },
    {
      kind: "outlined",
      hierarchy: "neutral",
      class:
        "pressed:bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-button-outlined-neutral-border-hover hover:bg-button-outlined-neutral-bg-hover",
    },

    // --- TONAL buttons ---
    {
      kind: "tonal",
      hierarchy: "brand",
      class:
        "bg-button-tonal-brand-bg hover:bg-button-tonal-brand-bg-hover pressed:bg-button-tonal-brand-bg-hover text-brand-700",
    },
    {
      kind: "tonal",
      hierarchy: "danger",
      class:
        "bg-button-tonal-danger-bg hover:bg-button-tonal-danger-bg-hover pressed:bg-button-tonal-danger-bg-hover text-error-600 border-button-tonal-danger-border",
    },
    {
      kind: "tonal",
      hierarchy: "neutral",
      class:
        "bg-button-tonal-neutral-bg hover:bg-button-tonal-neutral-bg-hover pressed:bg-button-tonal-neutral-bg-hover text-neutral-700 border-button-tonal-neutral-border",
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
