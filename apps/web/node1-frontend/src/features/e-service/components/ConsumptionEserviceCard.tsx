import type { bffApi } from "@knodia/bff-client";

import { Avatar } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { GenericInfoCard } from "@/components/GenericInfoCard";
import { getOrganizationInitials } from "@/utils/getOrganizationInitials";

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
      <ConsumptionEserviceInfoGrid>
        <AgreementInfoCard
          state={eservice.agreement.state as "Active" | "Suspended"}
        />
        <GenericInfoCard label="Active Purposes">-</GenericInfoCard>
        <GenericInfoCard label="Keychains">-</GenericInfoCard>
      </ConsumptionEserviceInfoGrid>
      <EserviceCardFooter
        mode={eservice.mode}
        state={eservice.state}
        trailing={
          <Avatar
            className="bg-brand-dark text-white"
            fallback={getOrganizationInitials(eservice.producer.name)}
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

function AgreementInfoCard({ state }: { state: "Active" | "Suspended" }) {
  const { bg, label } = match(state)
    .with("Active", () => ({ bg: "bg-success-light", label: "Active" }))
    .with("Suspended", () => ({ bg: "bg-error-light", label: "Suspended" }))
    .exhaustive();

  return (
    <dl
      className={`${bg} flex items-center justify-between rounded-lg px-4 py-3`}
    >
      <dt className="text-primary-light-low-contrast body-md">Agreement</dt>
      <dd className="body-md-em text-primary-dark">{label}</dd>
    </dl>
  );
}

function ConsumptionEserviceInfoGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="grid grid-cols-3 gap-1.5">{children}</div>;
}
