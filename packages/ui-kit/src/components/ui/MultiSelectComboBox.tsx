import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Button,
  Collection,
  composeRenderProps,
  Group,
  Input,
  type Key,
  ListBox,
  ListBoxLoadMoreItem,
  Popover,
  Tag,
  TagGroup,
  TagList,
  type ValidationResult,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { type VariantProps } from "tailwind-variants";

import { Description, FieldError, Label } from "./Field";
import {
  dropdownStyles,
  fieldGroupStyles,
  fieldInputStyles,
  fieldSizeStyles,
} from "./styles";

// The list item is identical to the single-select ComboBox's; re-export it so
// the two dropdowns can't drift.
export { ComboBoxItem as MultiSelectComboBoxItem } from "./ComboBox";

/** A selected entry rendered as a removable chip below the field. */
export interface MultiSelectComboBoxTag {
  key: Key;
  label: string;
}

// react-aria-components does not re-export LoadingState; mirror the
// react-stately union used by the async-list driving the infinite scroll.
type LoadingState =
  | "error"
  | "filtering"
  | "idle"
  | "loading"
  | "loadingMore"
  | "sorting";

interface MultiSelectComboBoxProps<T extends object> extends Omit<
  AriaComboBoxProps<T, "multiple">,
  "children" | "className" | "onChange" | "value"
> {
  children: (item: T) => React.ReactNode;
  /** Layout classes applied to the whole component (field + chip row). */
  className?: string;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  items?: Iterable<T>;
  label?: string;
  /** Loading state for the async list; drives the infinite-scroll sentinel. */
  loadingState?: LoadingState;
  // Controlled-only: chips are rendered from `selectedTags` and removal calls
  // `onChange`, so both are required (uncontrolled `defaultValue` would leave
  // chip removal unable to reflect the real selection).
  onChange: (keys: Key[]) => void;
  /** Called when the list is scrolled near the end (infinite scroll). */
  onLoadMore?: () => void;
  placeholder?: string;
  /** Selected entries rendered as removable chips below the field. */
  selectedTags?: MultiSelectComboBoxTag[];
  size?: MultiSelectComboBoxVariants["size"];
  value: Key[];
}

type MultiSelectComboBoxVariants = VariantProps<typeof fieldSizeStyles>;

export function MultiSelectComboBox<T extends object>({
  label,
  description,
  errorMessage,
  children,
  size,
  isInvalid = false,
  placeholder,
  items,
  loadingState,
  onLoadMore,
  selectedTags = [],
  className,
  value,
  onChange,
  ...props
}: MultiSelectComboBoxProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [popoverWidth, setPopoverWidth] = useState<number | undefined>();

  // Popover width fix: React Aria's --trigger-width doesn't reflect the Group
  // width when Group is the trigger. Measure it and apply it to the Popover.
  // (Same workaround as the single-select ComboBox.)
  useLayoutEffect(() => {
    if (!groupRef.current) return;

    const updateWidth = () => {
      if (groupRef.current) {
        setPopoverWidth(groupRef.current.offsetWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(groupRef.current);

    return () => observer.disconnect();
  }, []);

  const handleRemove = (keys: Set<Key>) => {
    onChange(value.filter((key) => !keys.has(key)));
  };

  return (
    // External layout classes apply to the whole component (field + chip row),
    // mirroring the single-select ComboBox where `className` sizes the field.
    <div
      className={twMerge(
        "flex flex-col gap-1 w-full min-w-0 font-sans",
        className,
      )}
    >
      <AriaComboBox<T, "multiple">
        {...props}
        allowsEmptyCollection
        className="group flex flex-col gap-1 w-full min-w-0 relative font-sans"
        isInvalid={isInvalid}
        items={items}
        menuTrigger="focus"
        onChange={onChange}
        selectionMode="multiple"
        value={value}
      >
        {label && <Label>{label}</Label>}
        <Group
          className={composeRenderProps(
            fieldSizeStyles({ size }),
            (groupClassName, renderProps) =>
              fieldGroupStyles({
                ...renderProps,
                isInvalid,
                className: groupClassName,
              }),
          )}
          ref={groupRef}
        >
          <Input
            className={fieldInputStyles()}
            placeholder={placeholder ?? "Search..."}
          />
          <Button className="outline-none">
            <CaretDownIcon
              aria-hidden
              className="w-5 h-5 text-primary-light-low-contrast"
            />
          </Button>
        </Group>
        {description && <Description>{description}</Description>}
        <FieldError>{errorMessage}</FieldError>
        <Popover
          className="mt-2"
          offset={0}
          style={{ width: popoverWidth }}
          triggerRef={groupRef}
        >
          <ListBox className={dropdownStyles}>
            <Collection items={items}>{children}</Collection>
            {onLoadMore && (
              <ListBoxLoadMoreItem
                isLoading={
                  loadingState === "loading" || loadingState === "loadingMore"
                }
                onLoadMore={onLoadMore}
              />
            )}
          </ListBox>
        </Popover>
      </AriaComboBox>
      {/* The chips live OUTSIDE <AriaComboBox>: inside, TagGroup picks up the
          ComboBox context and its onRemove breaks. */}
      {selectedTags.length > 0 && (
        <TagGroup
          aria-label={label ? `${label} (selected)` : "Selected"}
          className="flex flex-wrap gap-2"
          onRemove={handleRemove}
        >
          <TagList items={selectedTags}>
            {(tag) => (
              <Tag
                className="label-md inline-flex items-center gap-x-1 rounded-chip px-3 py-1 bg-secondary-light-decorative text-secondary-light-high-contrast outline-none"
                textValue={tag.label}
              >
                <span className="min-w-0 truncate">{tag.label}</span>
                <Button
                  className="outline-none cursor-pointer flex items-center justify-center"
                  slot="remove"
                >
                  <XIcon aria-hidden className="size-4" />
                </Button>
              </Tag>
            )}
          </TagList>
        </TagGroup>
      )}
    </div>
  );
}
