import type React from "react";

import { twMerge } from "tailwind-merge";

interface PageHeaderProps extends React.ComponentProps<"header"> {
  actions?: React.ReactNode;
  overline?: string;
  title: string;
  titleAs?: PageHeaderTitleTag;
}

type PageHeaderTitleTag = "h1" | "h2" | "h3";

export function PageHeader({
  actions,
  className,
  overline,
  title,
  titleAs: TitleTag = "h1",
  ...props
}: PageHeaderProps) {
  return (
    <header
      {...props}
      className={twMerge(
        "flex flex-wrap items-start justify-between gap-4 mb-10",
        className,
      )}
    >
      <div className="min-w-0">
        {overline ? (
          <p className="label-sm-em uppercase text-primary-light-low-contrast mb-2">
            {overline}
          </p>
        ) : null}
        <TitleTag className="headline-md text-primary-light-high-contrast">
          {title}
        </TitleTag>
      </div>
      {actions ? (
        <div className="flex items-center gap-4 shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}
