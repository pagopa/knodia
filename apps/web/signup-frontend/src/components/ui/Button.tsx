import {
  composeRenderProps,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "./styles";

const buttonStyles = tv({
  base: "box-border inline-flex h-(--button-height) items-center justify-center gap-(--button-gap) rounded-button px-(--button-padding-x) py-3 font-body text-button-md leading-button-md font-medium transition hover:cursor-pointer",
  extend: focusRing,
  variants: {
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
    variant: {
      primary:
        "bg-primary-violet text-neutral-white hover:bg-primary-violet-hover",
      secondary:
        "border-(length:--border-button) border-primary-violet bg-transparent text-primary-violet hover:border-primary-violet-hover hover:text-primary-violet-hover",
      text: "h-auto px-0 py-0 text-primary-violet hover:text-primary-violet-hover",
    },
  },
});

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
