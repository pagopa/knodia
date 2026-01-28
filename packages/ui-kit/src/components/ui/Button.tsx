import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { type VariantProps } from "tailwind-variants";

import { buttonStyles } from "./styles";

export type ButtonProps = ButtonVariants & RACButtonProps;

type ButtonVariants = VariantProps<typeof buttonStyles>;

export function Button({
  hierarchy,
  kind,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <RACButton
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
    </RACButton>
  );
}
