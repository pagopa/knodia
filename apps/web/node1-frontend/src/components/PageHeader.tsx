import type React from "react";

import { twMerge } from "tailwind-merge";

import { CopyableValueField } from "@/components/CopyableValueField";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  copyableId?: string;
  description?: string;
  overline?: string;
  resourceStatusChip?: React.ReactNode;
  title: string;
}

export function PageHeader({
  actions,
  children,
  className,
  copyableId,
  description,
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
        {copyableId && (
          <CopyableValueField className="mt-3" label="ID" value={copyableId} />
        )}
        {description && (
          <p className="mt-6 body-md text-primary-light-low-contrast max-w-160">
            {description}
          </p>
        )}
        {children}
      </div>
      {(actions || resourceStatusChip) && (
        <div className="flex items-center gap-10 shrink-0">
          {resourceStatusChip && <div>{resourceStatusChip}</div>}
          {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
      )}
    </header>
  );
}
