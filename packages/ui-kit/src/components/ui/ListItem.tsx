import {
  ListBoxItem as AriaListBoxItem,
  composeRenderProps,
  type ListBoxItemProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import { focusRing } from "../../libs/react-aria";

const listItem = tv({
  extend: focusRing,
  base: "group body-md relative flex w-full cursor-default items-center gap-3 rounded-md px-4 py-3 will-change-transform forced-color-adjust-none select-none [&_svg]:size-5 [&_svg]:shrink-0",
  compoundVariants: [
    {
      isDisabled: true,
      className:
        "text-primary-light-decorative [&_svg]:text-primary-light-decorative bg-transparent",
    },
    {
      isDisabled: false,
      isSelected: true,
      className:
        "bg-brand-light text-primary-light-mid-contrast [&_svg]:text-primary-light-low-contrast -outline-offset-4 outline-white [&+[data-selected]]:rounded-t-none [&:has(+[data-selected])]:rounded-b-none",
    },
    {
      isDisabled: false,
      isSelected: false,
      className:
        "pressed:bg-slate-100 text-primary-light-mid-contrast [&_svg]:text-primary-light-low-contrast -outline-offset-2 hover:bg-slate-100",
    },
  ],
});

export interface ListItemProps extends ListBoxItemProps {
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
}

export function ListItem({ startIcon, endIcon, ...props }: ListItemProps) {
  const textValue =
    props.textValue ||
    (typeof props.children === "string" ? props.children : "");

  return (
    <AriaListBoxItem {...props} className={listItem} textValue={textValue}>
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
    </AriaListBoxItem>
  );
}
