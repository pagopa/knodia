import type { bffApi } from "@knodia/bff-client";

import { Divider } from "@knodia/ui-kit/ui";
import { ArrowRightIcon } from "@phosphor-icons/react";

import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { ServiceCardHeader } from "@/components/ServiceCard";

import { EserviceModeChip } from "./EserviceModeChip";
import { EserviceStateChip } from "./EserviceStateChip";

export function EserviceCardFooter({
  children,
  mode,
  state,
  trailing,
}: {
  children?: React.ReactNode;
  mode: bffApi.EserviceMode;
  state: bffApi.EserviceVersionState;
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
  badge,
  description,
  headingLevel = 3,
  id,
  search,
  title,
  to,
}: {
  badge?: React.ReactNode;
  description?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  id: string;
  search?: { knodeId: string };
  title: string;
  to: string;
}) {
  return (
    <ServiceCardHeader
      clampText
      description={description}
      headingLevel={headingLevel}
      title={title}
    >
      {badge}
      <ButtonLinkWithPreload
        aria-label="Go to e-service"
        hierarchy="neutral"
        kind="outlined"
        params={{ id }}
        search={search}
        size="icon-md"
        to={to}
      >
        <ArrowRightIcon />
      </ButtonLinkWithPreload>
    </ServiceCardHeader>
  );
}
