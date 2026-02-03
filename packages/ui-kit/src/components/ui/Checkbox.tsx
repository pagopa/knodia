import { CheckFatIcon, MinusIcon } from "@phosphor-icons/react";
import {
  Checkbox as AriaCheckbox,
  composeRenderProps,
  type CheckboxProps as RACCheckboxProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing } from "./styles";

const checkboxStyles = tv({
  base: "flex relative gap-2 items-start group label-md text-primary-light-high-contrast transition",
});

const boxStyles = tv({
  extend: focusRing,
  base: "size-4 box-border shrink-0 rounded-sm flex items-center justify-center border transition",
  variants: {
    isSelected: {
      false:
        "bg-white border-(--color) [--color:var(--color-secondary-light-low-contrast)]",
      true: "bg-(--color) border-(--color) [--color:var(--color-brand-light-mid-contrast)]",
    },
    isInvalid: {
      true: "[--color:var(--color-error-light-decorative)]",
    },
    isDisabled: {
      true: "opacity-30",
    },
  },
});

const iconStyles = "w-2.5 h-2.5 text-white";

interface CheckboxProps extends RACCheckboxProps {
  description?: string;
}

export function Checkbox({ description, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        checkboxStyles({ ...renderProps, className }),
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { isSelected, isIndeterminate, ...renderProps }) => (
          <>
            <div
              className={boxStyles({
                isSelected: isSelected || isIndeterminate,
                ...renderProps,
              })}
            >
              {isIndeterminate ? (
                <MinusIcon aria-hidden className={iconStyles} />
              ) : isSelected ? (
                <CheckFatIcon
                  aria-hidden
                  className={iconStyles}
                  weight="fill"
                />
              ) : null}
            </div>
            <div className="flex-1 flex flex-col">
              {children}
              {description && (
                <span className="body-sm text-primary-light-mid-contrast">
                  {description}
                </span>
              )}
            </div>
          </>
        ),
      )}
    </AriaCheckbox>
  );
}
