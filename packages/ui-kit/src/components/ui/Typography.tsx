import { tv, type VariantProps } from "tailwind-variants";

import type { PolymorphicProps } from "../../types";

const typography = tv({
  base: "font-sans",
  variants: {
    variant: {
      titleMdEm: "title-md-em",
      bodyMd: "body-md",
      bodyMdEm: "body-md-em",
      labelMd: "label-md",
      labelSm: "label-sm",
      labelSmEm: "label-sm-em",
      labelLg: "label-lg",
    },
  },
  defaultVariants: {},
});

type TypographyVariants = VariantProps<typeof typography>;

export function Typography<E extends React.ElementType = "p">({
  as,
  variant,
  className,
  children,
  ...props
}: PolymorphicProps<E, TypographyVariants>) {
  const Component = as || "p";

  return (
    <Component className={typography({ variant, className })} {...props}>
      {children}
    </Component>
  );
}
