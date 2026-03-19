import {
  type CellProps,
  type ColumnProps,
  Cell as RACCell,
  Column as RACColumn,
  Row as RACRow,
  Table as RACTable,
  TableBody as RACTableBody,
  TableHeader as RACTableHeader,
  type RowProps,
  type TableHeaderProps,
  type TableProps,
} from "react-aria-components";

import { composeTailwindRenderProps } from "../../libs/react-aria";

export function Cell(props: CellProps) {
  return (
    <RACCell
      {...props}
      className={composeTailwindRenderProps(props.className, "px-4 py-3")}
    />
  );
}

export function Column(props: ColumnProps) {
  return (
    <RACColumn
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "px-4 pb-3 label-md text-primary-light-high-contrast",
      )}
    />
  );
}

export function Row<T extends object>(props: RowProps<T>) {
  return (
    <RACRow<T>
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "border-b border-slate-100 align-middle odd:bg-secondary-light even:bg-white",
      )}
    />
  );
}

export function Table(props: TableProps) {
  return (
    <RACTable
      {...props}
      className={composeTailwindRenderProps(props.className, "w-full")}
    />
  );
}

export { RACTableBody as TableBody };

export function TableHeader<T extends object>(props: TableHeaderProps<T>) {
  return (
    <RACTableHeader<T>
      {...props}
      className={composeTailwindRenderProps(
        props.className,
        "border-b border-black text-left",
      )}
    />
  );
}
