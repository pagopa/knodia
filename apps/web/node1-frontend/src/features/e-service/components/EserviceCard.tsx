import { ButtonLink, Divider } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";

import type { EserviceMode, EserviceVersionState } from "../types";

import { EserviceModeChip } from "./EserviceModeChip";
import { EserviceStateChip } from "./EserviceStateChip";

export function EserviceCard({ children }: { children: React.ReactNode }) {
  return (
    <article className="p-4 flex flex-col gap-4 rounded-2xl elevation-1 border border-slate-100">
      {children}
    </article>
  );
}

export function EserviceCardFooter({
  children,
  mode,
  state,
  trailing,
}: {
  children?: React.ReactNode;
  mode: EserviceMode;
  state: EserviceVersionState;
  trailing?: React.ReactNode;
}) {
  return (
    <footer className="flex items-center justify-between">
      <div className="flex items-center">
        <EserviceStateChip state={state} />
        <Divider className="mx-6" orientation="vertical" />
        <div className="flex gap-2 flex-wrap">
          <EserviceModeChip mode={mode} />
          {children}
        </div>
      </div>
      {trailing}
    </footer>
  );
}

export function EserviceCardHeader({
  description,
  id,
  title,
  to,
}: {
  description?: string;
  id: string;
  title: string;
  to: string;
}) {
  return (
    <header
      className={`flex gap-10 ${description ? "items-start" : "items-center"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="min-w-0 title-md-em truncate">{title}</h3>
        {description && (
          <p className="body-md text-primary-light-low-contrast line-clamp-2">
            {description}
          </p>
        )}
      </div>
      <ButtonLinkWithPreload
        aria-label="Go to e-service"
        hierarchy="neutral"
        kind="outlined"
        params={{ id }}
        size="icon-md"
        to={to}
      >
        <ArrowRightIcon />
      </ButtonLinkWithPreload>
    </header>
  );
}

const ButtonLinkWithPreload = createLink(ButtonLink);
