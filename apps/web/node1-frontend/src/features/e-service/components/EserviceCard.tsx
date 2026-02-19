import { bffApi } from "@knodia/bff-client";
import { ButtonLink, Chip, Divider } from "@knodia/ui-kit/ui";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { createLink } from "@tanstack/react-router";

import { GenericInfoCard } from "@/components/GenericInfoCard";

import { EserviceModeChip } from "./EserviceModeChip";
import { EserviceStateChip } from "./EserviceStateChip";

export function ProductionEserviceCard({
  eservice,
}: {
  eservice: bffApi.ProducerEservice;
}) {
  return (
    <EserviceCard>
      <EserviceCardHeader id={eservice.id} title={eservice.name.en} />
      <EserviceCardInfoGrid>
        <GenericInfoCard label="Active Agreements">-</GenericInfoCard>
        <GenericInfoCard label="Active Purposes">-</GenericInfoCard>
      </EserviceCardInfoGrid>
      <EserviceCardFooter mode="ProvideData" state="Active">
        {eservice.categories.map((category) => (
          <CategoryChip key={category.code} label={category.code} />
        ))}
      </EserviceCardFooter>
    </EserviceCard>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <Chip icon={<CheckIcon />} kind="neutral" label={label} type="light" />
  );
}

function EserviceCard({ children }: { children: React.ReactNode }) {
  return (
    <article className="p-4 flex flex-col gap-4 rounded-lg elevation-1 border border-slate-100">
      {children}
    </article>
  );
}

function EserviceCardFooter({
  children,
  mode,
  state,
}: {
  children?: React.ReactNode;
  mode: bffApi.EserviceMode;
  state: bffApi.EserviceVersionState;
}) {
  return (
    <footer className="flex items-center">
      <EserviceStateChip state={state} />
      <Divider className="mx-6" orientation="vertical" />
      <div className="flex gap-2 flex-wrap">
        <EserviceModeChip mode={mode} />

        {children}
      </div>
    </footer>
  );
}

const ButtonLinkWithPreload = createLink(ButtonLink);

function EserviceCardHeader({ id, title }: { id: string; title: string }) {
  return (
    <header className="flex items-center">
      <h3 className="flex-1 min-w-0 title-md-em truncate">{title}</h3>
      <ButtonLinkWithPreload
        aria-label="Go to e-service"
        hierarchy="neutral"
        kind="outlined"
        params={{ id }}
        size="icon-md"
        to="/production/e-services/$id"
      >
        <ArrowRightIcon />
      </ButtonLinkWithPreload>
    </header>
  );
}

function EserviceCardInfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}
