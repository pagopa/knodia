import {
  composeRenderProps,
  type FieldErrorProps,
  Group,
  type GroupProps,
  type InputProps,
  type LabelProps,
  FieldError as RACFieldError,
  Input as RACInput,
  Label as RACLabel,
  Text,
  type TextProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";

import {
  composeTailwindRenderProps,
  fieldGroupStyles,
} from "@/libs/react-aria";

export function Description(props: TextProps) {
  return (
    <Text
      {...props}
      className={twMerge("text-sm text-neutral-600", props.className)}
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
        "text-sm text-red-600 forced-colors:text-[Mark]",
      )}
    />
  );
}

export function FieldGroup(props: GroupProps) {
  return (
    <Group
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        fieldGroupStyles({ ...renderProps, className }),
      )}
    />
  );
}

export function Input(props: InputProps) {
  return (
    <RACInput
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "px-3 py-0 min-h-9 flex-1 min-w-0 border-0 outline-0 bg-white dark:bg-neutral-900 font-sans text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-600 dark:placeholder:text-neutral-400 disabled:text-neutral-200 dark:disabled:text-neutral-600 disabled:placeholder:text-neutral-200 dark:disabled:placeholder:text-neutral-600 [-webkit-tap-highlight-color:transparent]",
      )}
    />
  );
}

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={twMerge(
        "font-sans text-sm text-neutral-600 dark:text-neutral-300 font-medium cursor-default w-fit",
        props.className,
      )}
    />
  );
}
