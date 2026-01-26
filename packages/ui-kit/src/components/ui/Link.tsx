import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
  composeRenderProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "../../libs/react-aria";

const link = tv({
  extend: focusRing,
  base: "rounded-xs underline transition [-webkit-tap-highlight-color:transparent] disabled:cursor-default disabled:text-[GrayText] disabled:no-underline",
  variants: {
    variant: {
      primary: "text-blue-600 underline",
      secondary: "text-primary-light-high-contrast underline",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

type LinkProps = AriaLinkProps & LinkVariants;
type LinkVariants = VariantProps<typeof link>;

export function Link(props: LinkProps) {
  return (
    <AriaLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        link({ ...renderProps, className, variant: props.variant }),
      )}
    />
  );
}
