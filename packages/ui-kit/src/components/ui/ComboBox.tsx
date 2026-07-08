import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  composeRenderProps,
  Group,
  Input,
  ListBox,
  ListBoxItem,
  type ListBoxItemProps,
  Popover,
  type ValidationResult,
} from "react-aria-components";
import { type VariantProps } from "tailwind-variants";

import {
  composeTailwindRenderProps,
  useTriggerWidth,
} from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import {
  dropdownStyles,
  fieldGroupStyles,
  fieldInputStyles,
  fieldSizeStyles,
  listItemStyles,
} from "./styles";

interface ComboBoxProps<T extends object> extends Omit<
  AriaComboBoxProps<T>,
  "children"
> {
  children: ((item: T) => React.ReactNode) | React.ReactNode;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  isClearable?: boolean;
  items?: Iterable<T>;
  label?: string;
  placeholder?: string;
  /** Content shown when the filtered list is empty. Defaults to "No results found". */
  renderEmptyState?: () => React.ReactNode;
  size?: ComboBoxVariants["size"];
}

type ComboBoxVariants = VariantProps<typeof fieldSizeStyles>;

export function ComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  size,
  isInvalid = false,
  isClearable = false,
  placeholder,
  renderEmptyState = ComboBoxEmptyState,
  ...props
}: ComboBoxProps<T>) {
  const { triggerRef: groupRef, width: popoverWidth } = useTriggerWidth();

  const hasValue =
    (props.inputValue != null && props.inputValue !== "") ||
    (props.selectedKey != null && props.selectedKey !== "");

  const handleClear = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    props.onInputChange?.("");
    props.onSelectionChange?.(null);
  };

  return (
    <AriaComboBox<T>
      {...props}
      allowsEmptyCollection
      className={composeTailwindRenderProps(
        props.className,
        "group flex flex-col gap-1 w-full min-w-0 relative font-sans",
      )}
      isInvalid={isInvalid}
    >
      {label && <Label>{label}</Label>}
      <Group
        className={composeRenderProps(
          fieldSizeStyles({ size }),
          (className, renderProps) =>
            fieldGroupStyles({
              ...renderProps,
              isInvalid,
              className,
            }),
        )}
        ref={groupRef}
      >
        <Input
          className={fieldInputStyles()}
          placeholder={placeholder ?? "Search..."}
        />
        {isClearable && hasValue ? (
          <button
            aria-label="Clear selection"
            className="w-5 h-5 text-primary-light-low-contrast hover:text-primary-light-high-contrast transition-colors cursor-pointer flex items-center justify-center outline-none bg-transparent border-none p-0"
            onClick={handleClear}
            onPointerDown={handleClear}
            type="button"
          >
            <XIcon aria-hidden className="w-5 h-5" />
          </button>
        ) : (
          <Button className="outline-none">
            <CaretDownIcon
              aria-hidden
              className="w-5 h-5 text-primary-light-low-contrast"
            />
          </Button>
        )}
      </Group>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover
        className="mt-2"
        offset={0}
        style={{ width: popoverWidth }}
        triggerRef={groupRef}
      >
        <ListBox className={dropdownStyles} renderEmptyState={renderEmptyState}>
          {children}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}

// Shared "No results found" fallback so the single- and multi-select dropdowns
// can't drift; react-aria renders nothing on an empty list without it.
export function ComboBoxEmptyState() {
  return (
    <div className="body-md px-4 py-3 text-primary-light-low-contrast">
      No results found
    </div>
  );
}

export function ComboBoxItem(props: ListBoxItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");

  return (
    <ListBoxItem {...props} className={listItemStyles} textValue={textValue}>
      {composeRenderProps(props.children, (children) => (
        <span className="min-w-0 flex-1 truncate">{children}</span>
      ))}
    </ListBoxItem>
  );
}
