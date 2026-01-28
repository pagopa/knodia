import { ChevronDown } from "lucide-react";
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

import {
  composeTailwindRenderProps,
  fieldInputStyle,
} from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import { ListItem } from "./ListItem";

const styles = tv({
  extend: fieldInputStyle,
  base: "flex items-center text-start gap-4 w-full",
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

export interface DropdownItemProps extends ListBoxItemProps {
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
}
export interface SelectProps<T extends Iterable<unknown>>
  extends Omit<AriaSelectProps<T>, "children">, SelectVariants {
  children: ((item: T) => React.ReactNode) | React.ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  items: Iterable<T>;
  label?: string;
}

type SelectVariants = VariantProps<typeof styles>;

export function Select<T extends Iterable<unknown>>({
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
            isFocused: renderProps.isPressed,
          })
        }
      >
        <SelectValue className="flex-1 body-md truncate">
          {({ selectedText, defaultChildren }) =>
            selectedText || defaultChildren
          }
        </SelectValue>
        <ChevronDown
          aria-hidden
          className="w-5 h-5 text-primary-light-low-contrast"
        />
      </Button>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="min-w-(--trigger-width)">
        <ListBox
          className={
            "outline-0 p-2 bg-white border border-primary-light-decorative rounded-2xl shadow-dropdown flex flex-col gap-1 outline-hidden box-border max-h-[inherit] overflow-auto"
          }
          items={items}
        >
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
    <ListBoxItem {...props} textValue={textValue}>
      {composeRenderProps(props.children, (children, renderProps) => (
        <ListItem {...renderProps} endIcon={endIcon} startIcon={startIcon}>
          {children}
        </ListItem>
      ))}
    </ListBoxItem>
  );
}
