import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  type ValidationResult,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, Input, Label } from "./Field";

const textField = tv({
  base: "placeholder:text-primary-light-low-contrast",
  variants: {
    size: {
      sm: "py-1.25",
      md: "py-1.75",
      lg: "py-2.25",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface TextFieldProps extends AriaTextFieldProps, TextFieldVariants {
  description?: string;
  endIcon?: React.ReactNode;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
  placeholder?: string;
}
type TextFieldVariants = VariantProps<typeof textField>;

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
        "flex flex-col gap-1",
      )}
    >
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Input
          className={textField({
            ...props,
            className: props.endIcon ? "pr-12" : "",
          })}
          readOnly={props.isReadOnly}
        />
        {props.endIcon && (
          <span className="text-primary-light-low-contrast pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 [&>svg]:h-5 [&>svg]:w-5">
            {props.endIcon}
          </span>
        )}
      </div>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
