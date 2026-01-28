import type { ComponentPropsWithoutRef } from "react";

import {
  composeRenderProps,
  type FieldErrorProps,
  type LabelProps,
  FieldError as RACFieldError,
  Input as RACInput,
  Label as RACLabel,
  Text,
  type TextProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { fieldInputStyle } from "./styles";

export type InputProps = ComponentPropsWithoutRef<typeof RACInput>;

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      className={twMerge(
        "body-sm text-primary-light-low-contrast",
        props.className,
      )}
      slot="description"
    />
  );
}

export function FieldError(props: FieldErrorProps) {
  return (
    <RACFieldError
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "body-sm text-error-light-low-contrast",
      )}
    />
  );
}

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        twMerge(
          fieldInputStyle({ ...renderProps, isReadOnly: props.readOnly }),
          className,
        ),
      )}
    />
  );
}

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        "label-sm text-primary-light-low-contrast w-fit",
        props.className,
      )}
    />
  );
}
