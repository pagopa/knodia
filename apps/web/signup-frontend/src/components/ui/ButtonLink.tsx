import { createLink } from "@tanstack/react-router";
import {
  composeRenderProps,
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from "react-aria-components";
import { type VariantProps } from "tailwind-variants";

import { buttonStyles } from "./styles";

export type ButtonLinkProps = ButtonLinkVariants & RACLinkProps;

type ButtonLinkVariants = VariantProps<typeof buttonStyles>;

function ButtonLinkInternal({ children, ...props }: ButtonLinkProps) {
  return (
    <RACLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonStyles({
          ...renderProps,
          className,
        }),
      )}
    >
      {children}
    </RACLink>
  );
}

export const ButtonLink = createLink(ButtonLinkInternal);
