import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps as AriaComboBoxProps,
  Tag as AriaTag,
  Button,
  ButtonContext,
  Collection,
  ComboBoxValue,
  composeRenderProps,
  Group,
  Input,
  type Key,
  ListBox,
  ListBoxLoadMoreItem,
  Popover,
  TagGroup,
  TagList,
  type TagProps,
  type ValidationResult,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { type VariantProps } from "tailwind-variants";

import { useTriggerWidth } from "../../libs/react-aria";
import { Description, FieldError, Label } from "./Field";
import {
  chipStyles,
  dropdownStyles,
  fieldGroupStyles,
  fieldInputStyles,
  fieldSizeStyles,
} from "./styles";

// The list item is identical to the single-select ComboBox's; re-export it so
// the two dropdowns can't drift.
export { ComboBoxItem as MultiSelectComboBoxItem } from "./ComboBox";

// react-aria-components does not re-export LoadingState; mirror the
// react-stately union used by the async-list driving the infinite scroll.
type LoadingState =
  | "error"
  | "filtering"
  | "idle"
  | "loading"
  | "loadingMore"
  | "sorting";

interface MultiSelectComboBoxOption {
  id: string;
  label: string;
}

interface MultiSelectComboBoxProps extends Omit<
  AriaComboBoxProps<MultiSelectComboBoxOption, "multiple">,
  "children" | "className" | "onChange" | "value"
> {
  /** Trailing control rendered next to the input row (e.g. a CTA button),
   * so it aligns with the field rather than the label above or chips below. */
  action?: React.ReactNode;
  children: (item: MultiSelectComboBoxOption) => React.ReactNode;
  /** Layout classes applied to the whole component (field + chip row). */
  className?: string;
  description?: string;
  errorMessage?: ((validation: ValidationResult) => string) | string;
  items?: Iterable<MultiSelectComboBoxOption>;
  label?: string;
  /** Loading state for the async list; drives the infinite-scroll sentinel. */
  loadingState?: LoadingState;
  // Controlled-only: chips are rendered from `selectedTags` and removal calls
  // `onChange`, so all three are required. `selectedTags` is the only visual
  // feedback that a selection happened, so leaving it out would let the user
  // select an option and see nothing; an uncontrolled `defaultValue` would
  // likewise leave chip removal unable to reflect the real selection.
  onChange: (keys: Key[]) => void;
  /** Called when the list is scrolled near the end (infinite scroll). */
  onLoadMore?: () => void;
  placeholder?: string;
  size?: MultiSelectComboBoxVariants["size"];
  value: Key[];
}

type MultiSelectComboBoxVariants = VariantProps<typeof fieldSizeStyles>;

export function MultiSelectComboBox({
  action,
  label,
  description,
  errorMessage,
  children,
  size,
  isInvalid = false,
  isDisabled,
  isReadOnly,
  placeholder,
  items,
  loadingState,
  onLoadMore,
  className,
  value,
  onChange,
  ...props
}: MultiSelectComboBoxProps) {
  const { triggerRef: groupRef, width: popoverWidth } = useTriggerWidth();

  return (
    // External layout classes apply to the whole component (field + chip row),
    // mirroring the single-select ComboBox where `className` sizes the field.
    <div
      className={twMerge(
        "flex flex-col gap-1 w-full min-w-0 font-sans",
        className,
      )}
    >
      <AriaComboBox<MultiSelectComboBoxOption, "multiple">
        {...props}
        allowsEmptyCollection
        className="group flex flex-col gap-1 w-full min-w-0 relative font-sans"
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        isReadOnly={isReadOnly}
        items={items}
        menuTrigger="focus"
        onChange={onChange}
        selectionMode="multiple"
        value={value}
      >
        {label && <Label>{label}</Label>}
        {/* The action sits on the input's row (not the label above or the chips
            below), so it stays aligned with the field as chips grow. */}
        <div className="flex items-center gap-4">
          <Group
            className={composeRenderProps(
              fieldSizeStyles({ size }),
              (groupClassName, renderProps) =>
                fieldGroupStyles({
                  ...renderProps,
                  isInvalid,
                  className: twMerge("flex-1 min-w-0", groupClassName),
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
          {/* Reset ButtonContext: AriaComboBox provides its trigger props to
              every descendant Button, which would hijack the action button. */}
          <ButtonContext.Provider value={{}}>{action}</ButtonContext.Provider>
        </div>
        {description && <Description>{description}</Description>}
        <FieldError>{errorMessage}</FieldError>

        <ComboBoxValue<MultiSelectComboBoxOption>>
          {({ selectedItems, state }) => (
            <TagGroup
              aria-label={label ? `${label} (selected)` : "Selected"}
              onRemove={(keys) => {
                if (Array.isArray(state.value)) {
                  state.setValue(state.value.filter((k) => !keys.has(k)));
                }
              }}
            >
              <TagList
                className="flex flex-wrap gap-1"
                items={selectedItems.filter((item) => item != null)}
              >
                {(tag) => (
                  <Tag isDisabled={isDisabled || isReadOnly}>{tag.label}</Tag>
                )}
              </TagList>
            </TagGroup>
          )}
        </ComboBoxValue>

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
    </div>
  );
}

function Tag({ children, ...props }: TagProps) {
  const textValue = typeof children === "string" ? children : undefined;
  return (
    <AriaTag
      textValue={textValue}
      {...props}
      className={chipStyles({
        type: "light",
      })}
    >
      {composeRenderProps(
        children,
        (children, { allowsRemoving, isDisabled }) => (
          <>
            <span className="min-w-0 px-1 truncate">{children}</span>
            {allowsRemoving && !isDisabled && (
              <Button
                className="flex items-center justify-center rounded-full p-0.5 outline-none cursor-pointer transition hover:bg-chip-dismiss-bg-hover pressed:bg-chip-dismiss-bg-hover focus-visible:bg-chip-dismiss-bg-hover"
                slot="remove"
              >
                <XIcon aria-hidden className="size-4" />
              </Button>
            )}
          </>
        ),
      )}
    </AriaTag>
  );
}
