import { CaretUpIcon } from "@phosphor-icons/react";
import {
  Cell as AriaCell,
  Column as AriaColumn,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  type TableProps as AriaTableProps,
  type CellProps,
  Collection,
  type ColumnProps,
  composeRenderProps,
  Group,
  ResizableTableContainer,
  type RowProps,
  type TableBodyProps,
  type TableHeaderProps,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

import { composeTailwindRenderProps } from "./../../libs/react-aria";
import { focusRing } from "./styles";

interface TableProps extends Omit<AriaTableProps, "className"> {
  className?: string;
}

export function Table(props: TableProps) {
  return (
    <ResizableTableContainer
      className={twMerge(
        "w-full overflow-auto relative bg-white",
        props.className,
      )}
      onScroll={props.onScroll}
    >
      <AriaTable
        {...props}
        className="overflow-hidden has-[>[data-empty]]:h-full"
      />
    </ResizableTableContainer>
  );
}

const columnStyles = tv({
  extend: focusRing,
  base: "px-4 h-10 box-border flex-1 flex gap-1 items-center overflow-hidden",
});

export function Column(props: ColumnProps) {
  return (
    <AriaColumn
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "text-start label-md text-primary-light-high-contrast cursor-default",
      )}
    >
      {composeRenderProps(
        props.children,
        (children, { allowsSorting, sortDirection }) => (
          <div className="flex items-center">
            <Group className={columnStyles} role="presentation" tabIndex={-1}>
              <span className="truncate">{children}</span>
              {allowsSorting && (
                <span
                  className={`w-4 h-4 flex items-center justify-center transition ${
                    sortDirection === "descending" ? "rotate-180" : ""
                  }`}
                >
                  {sortDirection && (
                    <CaretUpIcon
                      aria-hidden
                      className="w-4 h-4 text-primary-light-low-contrast"
                    />
                  )}
                </span>
              )}
            </Group>
          </div>
        ),
      )}
    </AriaColumn>
  );
}

export function TableBody<T extends object>(props: TableBodyProps<T>) {
  return (
    <AriaTableBody
      {...props}
      className="empty:text-center empty:text-sm [&_tr:nth-child(even)]:bg-secondary-light"
    />
  );
}

export function TableHeader<T extends object>(props: TableHeaderProps<T>) {
  return (
    <AriaTableHeader
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "border-b border-b-primary-light-high-contrast",
      )}
    >
      <Collection items={props.columns}>{props.children}</Collection>
    </AriaTableHeader>
  );
}

const rowStyles = tv({
  extend: focusRing,
  base: "group/row relative h-14 cursor-default body-md text-primary-light-mid-contrast",
});

export function Row<T extends object>({
  id,
  columns,
  children,
  ...otherProps
}: RowProps<T>) {
  return (
    <AriaRow id={id} {...otherProps} className={rowStyles}>
      <Collection items={columns}>{children}</Collection>
    </AriaRow>
  );
}

const cellStyles = tv({
  extend: focusRing,
  base: "box-border p-4 truncate",
});

export function Cell(props: CellProps) {
  return <AriaCell {...props} className={cellStyles} />;
}
