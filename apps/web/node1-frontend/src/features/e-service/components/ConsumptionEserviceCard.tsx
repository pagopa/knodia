import type { bffApi } from "@knodia/bff-client";

import { match } from "ts-pattern";

import { GenericInfoCard } from "@/components/GenericInfoCard";
import { KnodeAvatar } from "@/components/KnodeAvatar";

import { CategoryChip } from "./CategoryChip";
import {
  EserviceCard,
  EserviceCardFooter,
  EserviceCardHeader,
} from "./EserviceCard";

export function ConsumptionEserviceCard({
  eservice,
}: {
  eservice: bffApi.ConsumerEservice;
}) {
  return (
    <EserviceCard>
      <EserviceCardHeader
        id={eservice.id}
        search={{ knodeId: eservice.producer.knodeId }}
        title={eservice.name.en}
        to="/consumption/e-services/$id"
      />
      <div className="grid grid-cols-3 gap-1.5">
        <AgreementInfoCard state={eservice.agreement.state} />
        <GenericInfoCard label="Active Purposes">
          {eservice.activePurposes}
        </GenericInfoCard>
        <GenericInfoCard label="Keychains">
          {eservice.consumerKeychains}
        </GenericInfoCard>
      </div>
      <EserviceCardFooter
        mode={eservice.mode}
        state={eservice.state}
        trailing={
          <KnodeAvatar
            className="bg-brand-dark text-white"
            knodeId={eservice.producer.knodeId}
            name={eservice.producer.name}
            size="sm"
          />
        }
      >
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

function AgreementInfoCard({ state }: { state: bffApi.AgreementState }) {
  const style = match(state)
    .with("Active", () => ({ bg: "bg-success-light", label: "Active" }))
    .with("Suspended", () => ({ bg: "bg-error-light", label: "Suspended" }))
    .with("Archived", () => {
      console.warn("Unexpected Archived agreement in consumer e-services list");
      return null;
    })
    .exhaustive();

  if (!style) return null;

  return (
    <GenericInfoCard className={style.bg} label="Agreement">
      {style.label}
    </GenericInfoCard>
  );
}
