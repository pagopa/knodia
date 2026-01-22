import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import {
  composeTailwindRenderProps,
  fieldBorderStyles,
  focusRing,
} from "../../libs/react-aria";
import { Description, FieldError, Input, Label } from "./Field";

const inputStyles = tv({
  extend: focusRing,
  base: "border-1 rounded-lg min-h-9 font-sans text-sm py-0 px-3 box-border transition",
  variants: {
    isFocused: fieldBorderStyles.variants.isFocusWithin,
    isInvalid: fieldBorderStyles.variants.isInvalid,
    isDisabled: fieldBorderStyles.variants.isDisabled,
  },
});

export interface TextFieldProps extends AriaTextFieldProps {
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
  placeholder?: string;
}

export function TextField({
  description,
  errorMessage,
  label,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-1 font-sans",
      )}
    >
      {label && <Label>{label}</Label>}
      <Input className={inputStyles} />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
