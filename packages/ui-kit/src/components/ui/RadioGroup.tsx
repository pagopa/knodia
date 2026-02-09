import {
  composeRenderProps,
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioProps as RACRadioProps,
  type ValidationResult,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import { focusRing } from "./styles";

interface RadioGroupProps extends Omit<RACRadioGroupProps, "children"> {
  children?: React.ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  label?: string;
}

export function RadioGroup(props: RadioGroupProps) {
  return (
    <RACRadioGroup
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-3 font-sans",
      )}
    >
      <Label>{props.label}</Label>
      <div className="flex group-orientation-vertical:flex-col gap-4">
        {props.children}
      </div>
      {props.description && <Description>{props.description}</Description>}
      <FieldError>{props.errorMessage}</FieldError>
    </RACRadioGroup>
  );
}

const radio = tv({
  extend: focusRing,
  base: "size-4 box-border rounded-full border bg-transparent transition-all border-secondary-light-low-contrast group-pressed:border-secondary-light-mid-contrast",
  variants: {
    isSelected: {
      true: "relative after:absolute after:inset-0.75 after:rounded-full after:bg-brand-light-mid-contrast",
    },

    isDisabled: {
      true: "opacity-30",
    },
  },
});

interface RadioProps extends RACRadioProps {
  description?: React.ReactNode;
}

export function Radio({ description, ...props }: RadioProps) {
  return (
    <RACRadio
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "flex relative gap-2 items-start group label-md text-primary-light-high-contrast",
      )}
    >
      {composeRenderProps(props.children, (children, renderProps) => (
        <>
          <div className={radio(renderProps)} />
          <div className="flex-1 flex flex-col">
            {children}
            {description && (
              <span className="body-sm text-primary-light-mid-contrast">
                {description}
              </span>
            )}
          </div>
        </>
      ))}
    </RACRadio>
  );
}
