import type { ReactNode } from "react";

import { Pagination, type PaginationProps } from "@knodia/ui-kit/ui";

interface ListPageLayoutProps {
  children: ReactNode;
  pagination?: Omit<PaginationProps, "className">;
}

export function ListPageLayout({ children, pagination }: ListPageLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      {children}
      {pagination && (
        <Pagination className="mx-auto mt-auto pt-6" {...pagination} />
      )}
    </div>
  );
}
