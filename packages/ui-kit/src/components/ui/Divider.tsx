import { tv, type VariantProps } from "tailwind-variants";

import type { PolymorphicProps } from "../../types";

const divider = tv({
  base: "shrink-0",
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px",
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

export type DividerProps<E extends React.ElementType = "div"> =
  PolymorphicProps<E, DividerVariants>;
type DividerVariants = VariantProps<typeof divider>;

export function Divider<E extends React.ElementType = "div">({
  as,
  orientation,
  kind,
  className,
  type,
  ...props
}: PolymorphicProps<E, DividerVariants>) {
  const Component = as || "div";

  return (
    <Component
      aria-orientation={orientation}
      className={divider({ orientation, kind, type, className })}
      role="separator"
      {...props}
    />
  );
}
