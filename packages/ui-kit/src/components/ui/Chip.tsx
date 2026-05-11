import { tv, type VariantProps } from "tailwind-variants";

const chip = tv({
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

export interface ChipProps
  extends ChipVariants, Omit<React.ComponentProps<"span">, "children"> {
  icon?: React.ReactNode;
  label: string;
}

type ChipVariants = VariantProps<typeof chip>;

export function Chip({ icon, label, ...props }: ChipProps) {
  return (
    <span {...props} className={chip({ ...props, className: props.className })}>
      {icon}
      <span className="px-1 truncate">{label}</span>
    </span>
  );
}
