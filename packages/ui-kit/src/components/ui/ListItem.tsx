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

// const dropdownItemStyles = tv({
//   base: "group selected:pr-1 flex cursor-default items-center gap-4 rounded-lg py-2 pr-3 pl-3 text-sm no-underline outline outline-0 forced-color-adjust-none select-none [-webkit-tap-highlight-color:transparent] [&[href]]:cursor-pointer",
//   variants: {
//     isDisabled: {
//       false: "text-neutral-900 dark:text-neutral-100",
//       true: "text-neutral-300 dark:text-neutral-600 forced-colors:text-[GrayText]",
//     },
//     isPressed: {
//       true: "bg-neutral-100 dark:bg-neutral-800",
//     },
//     isFocused: {
//       true: "bg-blue-600 text-white dark:bg-blue-600 forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
//     },
//   },
//   compoundVariants: [
//     {
//       isFocused: false,
//       isOpen: true,
//       className: "bg-neutral-100 dark:bg-neutral-700/60",
//     },
//   ],
// });

// export interface DropdownSectionProps<T> extends SectionProps<T> {
//   items?: Iterable<T>;
//   title?: string;
// }

// export function DropdownItem(props: ListBoxItemProps) {
//   const textValue =
//     props.textValue ||
//     (typeof props.children === "string" ? props.children : "");
//   return (
//     <AriaListBoxItem
//       {...props}
//       className={dropdownItemStyles}
//       textValue={textValue}
//     >
//       {composeRenderProps(props.children, (children, { isSelected }) => (
//         <>
//           <span className="group-selected:font-semibold flex flex-1 items-center gap-2 truncate font-normal">
//             {children}
//           </span>
//           <span className="flex w-5 items-center">
//             {isSelected && <Check className="h-4 w-4" />}
//           </span>
//         </>
//       ))}
//     </AriaListBoxItem>
//   );
// }

// export function DropdownSection<T extends object>(
//   props: DropdownSectionProps<T>,
// ) {
//   return (
//     <ListBoxSection className="after:block after:h-[5px] after:content-[''] first:-mt-[5px] last:after:hidden">
//       <Header className="sticky -top-[5px] z-10 -mx-1 -mt-px truncate border-y border-y-neutral-200 bg-neutral-100/60 px-4 py-1 text-sm font-semibold text-neutral-500 backdrop-blur-md supports-[-moz-appearance:none]:bg-neutral-100 dark:border-y-neutral-700 dark:bg-neutral-700/60 dark:text-neutral-300 [&+*]:mt-1">
//         {props.title}
//       </Header>
//       <Collection items={props.items ?? []}>{props.children}</Collection>
//     </ListBoxSection>
//   );
// }
