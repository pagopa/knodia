import type React from "react";

import { twMerge } from "tailwind-merge";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  overline?: string;
  resourceStatusChip?: React.ReactNode;
  title: string;
}

export function PageHeader({
  actions,
  children,
  className,
  overline,
  resourceStatusChip,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      {...props}
      className={twMerge(
        "flex items-start justify-between gap-10 mb-10",
        className,
      )}
    >
      <div className="min-w-0">
        {overline && (
          <p className="label-sm-em uppercase text-primary-light-low-contrast mb-2">
            {overline}
          </p>
        )}
        <h1 className="headline-md text-primary-light-high-contrast">
          {title}
        </h1>
        {children}
      </div>
      {(actions || resourceStatusChip) && (
        <div className="flex items-center gap-10 shrink-0">
          <div>{resourceStatusChip}</div>
          <div className="flex items-center gap-4">{actions}</div>
        </div>
      )}
    </header>
  );
}
