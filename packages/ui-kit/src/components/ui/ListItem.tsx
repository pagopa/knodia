import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
} from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

import { focusRing } from "../../libs/react-aria";

const listItem = tv({
  extend: focusRing,
  base: "group body-md relative flex w-full items-center gap-3 rounded-md px-4 py-3 will-change-transform forced-color-adjust-none select-none [&_svg]:size-5 [&_svg]:shrink-0",
  variants: {
    isDisabled: { true: "", false: "" },
    isSelected: { true: "", false: "" },
  },
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

export type ListItemProps = VariantProps<typeof listItem> & {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
};

export function ListItem({
  asChild = false,
  startIcon,
  endIcon,
  children,
  className,
  ...variants
}: ListItemProps) {
  const classes = listItem({ ...variants, className });

  const content = (
    <>
      {startIcon && <span aria-hidden="true">{startIcon}</span>}

      <span className="min-w-0 flex-1 truncate">{children}</span>

      {endIcon && (
        <span aria-hidden="true" className="ml-auto">
          {endIcon}
        </span>
      )}
    </>
  );

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error(
        "ListItem with asChild expects a single React element child.",
      );
    }

    const child = Children.only(children) as ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>;

    return cloneElement(child, {
      className: twMerge(classes, child.props.className),
      children: content,
    });
  }

  return <span className={classes}>{content}</span>;
}
