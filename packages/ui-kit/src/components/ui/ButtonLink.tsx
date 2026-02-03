import {
  composeRenderProps,
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from "react-aria-components";
import { type VariantProps } from "tailwind-variants";

import { buttonStyles } from "./styles";

export type ButtonLinkProps = ButtonLinkVariants & RACLinkProps;

type ButtonLinkVariants = VariantProps<typeof buttonStyles>;

export function ButtonLink({
  hierarchy,
  kind,
  size,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <RACLink
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonStyles({
          ...renderProps,
          className,
          hierarchy,
          kind,
          size,
        }),
      )}
    >
      {children}
    </RACLink>
  );
}
