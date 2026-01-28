import { composeRenderProps, Button as RACButton } from "react-aria-components";
import { tv } from "tailwind-variants";

import { type ButtonProps, buttonVariants } from "./Button";

export type ButtonIconProps = ButtonProps;

const buttonIconVariants = tv({
  extend: buttonVariants,
  base: "[&>svg]:h-5 [&>svg]:w-5",
  variants: {
    size: {
      sm: "h-auto p-1.5",
      md: "h-auto p-2",
      lg: "h-auto p-2.5",
    },
  },
});

export function ButtonIcon({
  hierarchy,
  kind,
  size,
  children,
  ...props
}: ButtonIconProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonIconVariants({
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
