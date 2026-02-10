import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import {
  NumberField as AriaNumberField,
  type NumberFieldProps as AriaNumberFieldProps,
  Button,
  type ButtonProps,
  type ValidationResult,
} from "react-aria-components";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, FieldGroup, Input, Label } from "./Field";
import { fieldBorderStyles } from "./styles";

interface NumberFieldProps extends AriaNumberFieldProps {
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
  placeholder?: string;
}

export function NumberField({
  description,
  errorMessage,
  label,
  placeholder,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1",
      )}
    >
      {label && <Label>{label}</Label>}
      <FieldGroup>
        {(renderProps) => (
          <>
            <Input
              className="w-full border-0 px-3 py-2"
              {...(placeholder && { placeholder })}
            />
            <div
              className={fieldBorderStyles({
                ...renderProps,
                class: "flex h-full flex-col border-s",
              })}
            >
              <StepperButton slot="increment">
                <CaretUpIcon aria-hidden className="size-4" />
              </StepperButton>
              <div
                className={fieldBorderStyles({
                  ...renderProps,
                  class: "border-b",
                })}
              />
              <StepperButton slot="decrement">
                <CaretDownIcon aria-hidden className="size-4" />
              </StepperButton>
            </div>
          </>
        )}
      </FieldGroup>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </AriaNumberField>
  );
}

function StepperButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      className="text-primary-light-low-contrast pressed:bg-neutral-100 group-disabled:text-primary-light-decorative flex flex-1 cursor-default items-center justify-center border-0 bg-transparent px-1 py-0 [-webkit-tap-highlight-color:transparent]"
    />
  );
}
