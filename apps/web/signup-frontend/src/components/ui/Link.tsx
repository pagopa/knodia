import {
  composeRenderProps,
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing } from "./styles";

const linkStyles = tv({
  base: "cursor-pointer font-body text-[16px] leading-[21px] font-semibold tracking-[-0.16px] text-primary-violet underline hover:text-primary-violet-hover",
  extend: focusRing,
});

/** @knipignore — scaffolded in KN-739, wired up by the next signup screens */
export function Link({ children, ...props }: RACLinkProps) {
  return (
    <RACLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        linkStyles({ ...renderProps, className }),
      )}
    >
      {children}
    </RACLink>
  );
}
