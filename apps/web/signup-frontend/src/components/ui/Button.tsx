import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { type VariantProps } from "tailwind-variants";

import { buttonStyles } from "./styles";

type ButtonProps = RACButtonProps & VariantProps<typeof buttonStyles>;

export function Button({ children, variant, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonStyles({ ...renderProps, className, variant }),
      )}
    >
      {children}
    </RACButton>
  );
}
