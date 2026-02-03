import { Separator, type SeparatorProps } from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

const divider = tv({
  base: "border-none",
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px min-h-8 h-full",
    },
    type: {
      dark: "",
      light: "",
    },
    kind: {
      brand: "",
      primary: "",
      secondary: "",
      informative: "",
      success: "",
      warning: "",
      error: "",
    },
  },
  compoundVariants: [
    {
      kind: "brand",
      type: "light",
      className: "bg-brand-light-decorative",
    },
    {
      kind: "brand",
      type: "dark",
      className: "bg-brand-dark-decorative",
    },
    {
      kind: "primary",
      type: "light",
      className: "bg-primary-light-decorative",
    },
    {
      kind: "primary",
      type: "dark",
      className: "bg-primary-dark-decorative",
    },
    {
      kind: "secondary",
      type: "light",
      className: "bg-secondary-light-decorative",
    },
    {
      kind: "secondary",
      type: "dark",
      className: "bg-secondary-dark-decorative",
    },
    {
      kind: "informative",
      type: "light",
      className: "bg-info-light-decorative",
    },
    {
      kind: "informative",
      type: "dark",
      className: "bg-info-dark-decorative",
    },
    {
      kind: "success",
      type: "light",
      className: "bg-success-light-decorative",
    },
    {
      kind: "success",
      type: "dark",
      className: "bg-success-dark-decorative",
    },
    {
      kind: "warning",
      type: "light",
      className: "bg-warning-light-decorative",
    },
    {
      kind: "warning",
      type: "dark",
      className: "bg-warning-dark-decorative",
    },
    {
      kind: "error",
      type: "light",
      className: "bg-error-light-decorative",
    },
    {
      kind: "error",
      type: "dark",
      className: "bg-error-dark-decorative",
    },
  ],
  defaultVariants: {
    orientation: "horizontal",
    kind: "primary",
    type: "light",
  },
});

export type DividerProps = DividerVariants & SeparatorProps;
type DividerVariants = VariantProps<typeof divider>;

export function Divider({ kind, type, ...props }: DividerProps) {
  return (
    <Separator
      {...props}
      className={divider({
        kind,
        type,
        orientation: props.orientation,
        className: props.className,
      })}
    />
  );
}
