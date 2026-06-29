import { useId } from "react";
import {
  composeRenderProps,
  Checkbox as RACCheckbox,
  type CheckboxProps as RACCheckboxProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { ReportFilledIcon } from "@/components/icons";

import { fieldErrorTextClass, focusRing } from "./styles";

const checkboxStyles = tv({
  base: "group flex cursor-pointer items-start gap-2",
});

const boxStyles = tv({
  base: "mt-[2px] flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
  extend: focusRing,
  variants: {
    isDisabled: {
      true: "opacity-30",
    },
    isInvalid: {
      true: "border-status-error",
    },
    isSelected: {
      false: "border-input-border bg-neutral-white",
      true: "border-primary-violet bg-primary-violet",
    },
  },
});

interface CheckboxProps extends RACCheckboxProps {
  errorMessage?: string;
}

export function Checkbox({ errorMessage, ...props }: CheckboxProps) {
  const errorId = useId();

  return (
    <RACCheckbox
      aria-describedby={errorMessage ? errorId : undefined}
      isInvalid={props.isInvalid ?? Boolean(errorMessage)}
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        checkboxStyles({ ...renderProps, className }),
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { isSelected, ...renderProps }) => (
          <>
            <span className={boxStyles({ isSelected, ...renderProps })}>
              {isSelected && (
                <svg
                  aria-hidden
                  className="size-2.5 text-neutral-white"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  viewBox="0 0 16 16"
                >
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
              )}
            </span>
            <span className="flex flex-1 flex-col gap-[6px]">
              <span className="text-style-label text-neutral-graphite">
                {children}
              </span>
              {errorMessage && (
                <span
                  className={`flex items-center gap-1 ${fieldErrorTextClass}`}
                  id={errorId}
                >
                  <ReportFilledIcon className="size-4 shrink-0" />
                  {errorMessage}
                </span>
              )}
            </span>
          </>
        ),
      )}
    </RACCheckbox>
  );
}
