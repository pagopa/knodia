import type { bffApi } from "@knodia/bff-client";

import { GenericInfoCard } from "@/components/GenericInfoCard";

import {
  CategoryChip,
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
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
          />
        ))}
      </EserviceCardFooter>
    </EserviceCard>
  );
}

function EserviceCardInfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-1.5">{children}</div>;
}
