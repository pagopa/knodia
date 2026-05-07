import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  composeRenderProps,
  TextArea as RACTextArea,
  type ValidationResult,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import { fieldInputStyle, focusRing } from "./styles";

const textArea = tv({
  base: "resize-none rounded-textarea",
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

export interface TextAreaProps extends AriaTextFieldProps, TextAreaVariants {
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
}
type TextAreaVariants = VariantProps<typeof textArea>;

export function TextArea({
  description,
  errorMessage,
  label,
  ...props
}: TextAreaProps) {
  return (
    <AriaTextField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex flex-col gap-1",
      )}
    >
      {label && <Label>{label}</Label>}
      <RACTextArea
        className={composeRenderProps(
          textArea({ size: props.size }),
          (className, renderProps) =>
            twMerge(
              fieldInputStyle({ ...renderProps, isReadOnly: props.isReadOnly }),
              focusRing(renderProps),
              className,
            ),
        )}
        readOnly={props.isReadOnly}
        rows={3}
      />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
