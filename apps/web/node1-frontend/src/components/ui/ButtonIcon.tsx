import { composeRenderProps, Button as RACButton } from "react-aria-components";
import { tv } from "tailwind-variants";

import { type ButtonProps, buttonVariants } from "@/components/ui/Button";

export type ButtonIconProps = ButtonProps;

const buttonIconVariants = tv({
  extend: buttonVariants,
  variants: {
    size: {
      sm: "p-1.5 h-auto",
      md: "p-2 h-auto",
      lg: "p-2.5 h-auto",
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
