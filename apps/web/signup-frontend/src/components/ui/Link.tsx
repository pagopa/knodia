import {
  composeRenderProps,
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing } from "./styles";

const linkStyles = tv({
  base: "cursor-pointer text-primary-violet underline hover:text-primary-violet-hover",
  defaultVariants: {
    variant: "body",
  },
  extend: focusRing,
  variants: {
    variant: {
      body: "font-body text-[16px] leading-[21px] font-semibold tracking-[-0.16px]",
      caption: "font-caption text-[16px] leading-[22px] font-semibold",
    },
  },
});

interface LinkProps extends RACLinkProps {
  variant?: "body" | "caption";
}

export function Link({ children, variant, ...props }: LinkProps) {
  return (
    <RACLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        linkStyles({ ...renderProps, className, variant }),
      )}
    >
      {children}
    </RACLink>
  );
}
