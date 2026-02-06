import { CaretDownIcon } from "@phosphor-icons/react";
import {
  Select as AriaSelect,
  type SelectProps as AriaSelectProps,
  Button,
  composeRenderProps,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  SelectValue,
  type ValidationResult,
} from "react-aria-components";
import { tv, type VariantProps } from "tailwind-variants";

import { composeTailwindRenderProps } from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import { dropdownStyles, fieldInputStyle, listItemStyles } from "./styles";

const styles = tv({
  extend: fieldInputStyle,
  base: "bg-white flex items-center text-start gap-4 w-full",
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

const selectValue = tv({
  base: "flex-1 body-md truncate",
  variants: {
    isPlaceholder: {
      true: "text-primary-light-low-contrast",
      false: "text-primary-light-high-contrast",
    },
  },
});

export interface SelectProps<T extends object>
  extends Omit<AriaSelectProps<T>, "children">, SelectVariants {
  children: ((item: T) => React.ReactNode) | React.ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  items?: Iterable<T>;
  label?: string;
}
interface DropdownItemProps extends ListBoxItemProps {
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
}

type SelectVariants = VariantProps<typeof styles>;

export function Select<T extends object>({
  label,
  description,
  errorMessage,
  children,
  items,
  size,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1 relative font-sans",
      )}
    >
      {label && <Label>{label}</Label>}
      <Button
        className={(renderProps) =>
          styles({
            ...renderProps,
            size,
            isInvalid: props.isInvalid,
            isFocused: renderProps.isFocused,
          })
        }
      >
        <SelectValue
          className={(renderProps) =>
            selectValue({ isPlaceholder: renderProps.isPlaceholder })
          }
        >
          {({ selectedText, defaultChildren }) =>
            selectedText || defaultChildren
          }
        </SelectValue>
        <CaretDownIcon
          aria-hidden
          className="w-5 h-5 text-primary-light-low-contrast"
        />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox className={dropdownStyles} items={items as Iterable<T>}>
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
export function SelectItem({
  endIcon,
  startIcon,
  ...props
}: DropdownItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");

  return (
    <ListBoxItem {...props} className={listItemStyles} textValue={textValue}>
      {composeRenderProps(props.children, (children) => (
        <>
          {startIcon && <span aria-hidden="true">{startIcon}</span>}

          <span className="min-w-0 flex-1 truncate">{children}</span>

          {endIcon && (
            <span aria-hidden="true" className="ml-auto">
              {endIcon}
            </span>
          )}
        </>
      ))}
    </ListBoxItem>
  );
}
