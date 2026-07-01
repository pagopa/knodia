import type { bffApi } from "@knodia/bff-client";

import { GenericInfoCard } from "@/components/GenericInfoCard";

import { CategoryChip } from "./CategoryChip";
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
        headingLevel={2}
        id={eservice.id}
        title={eservice.name.en}
        to="/production/e-services/$id"
      />
      <EserviceCardInfoGrid>
        <GenericInfoCard label="Active Agreements">
          {eservice.activeAgreements}
        </GenericInfoCard>
        <GenericInfoCard label="Active Purposes">
          {eservice.activePurposes}
        </GenericInfoCard>
      </EserviceCardInfoGrid>
      <EserviceCardFooter mode={eservice.mode} state={eservice.state}>
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
