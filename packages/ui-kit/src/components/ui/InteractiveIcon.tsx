import {
  Button,
  type ButtonProps,
  composeRenderProps,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "../../libs/react-aria";

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = tv({
  extend: focusRing,
  base: "body-md-em relative inline-flex items-center justify-center rounded-full transition p-2 [&>svg]:size-5",
  variants: {
    hierarchy: {
      brand: "text-brand-700 hover:bg-brand-700/10 pressed:bg-brand-700/10",
      danger: "text-error-700 hover:bg-error-700/10 pressed:bg-error-700/10",
      neutral:
        "pressed:bg-neutral-600/10 text-neutral-600 hover:bg-neutral-600/10",
    },
    isDisabled: {
      true: "cursor-not-allowed opacity-30",
    },
  },
  defaultVariants: {
    hierarchy: "neutral",
  },
});

export type InteractiveIconProps = ButtonProps & ButtonVariants;

type ButtonVariants = VariantProps<typeof buttonVariants>;

export function InteractiveIcon({
  children,
  hierarchy,
  ...props
}: InteractiveIconProps) {
  return (
    <Button
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonVariants({
          ...renderProps,
          className,
          hierarchy,
        }),
      )}
    >
      {children}
    </Button>
  );
}
