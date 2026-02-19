import type { bffApi } from "@knodia/bff-client";

import { Chip } from "@knodia/ui-kit/ui";
import { CheckIcon } from "@phosphor-icons/react";

import { GenericInfoCard } from "@/components/GenericInfoCard";

import {
  EserviceCard,
  EserviceCardFooter,
  EserviceCardHeader,
} from "./EserviceCard";

export function ProductionEserviceCard({
  eservice,
}: {
  eservice: bffApi.ProducerEservice;
}) {
  return (
    <EserviceCard>
      <EserviceCardHeader
        id={eservice.id}
        title={eservice.name.en}
        to="/production/e-services/$id"
      />
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

function EserviceCardInfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}
