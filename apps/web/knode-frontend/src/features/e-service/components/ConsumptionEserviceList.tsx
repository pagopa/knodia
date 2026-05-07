import type { bffApi } from "@knodia/bff-client";

import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceListParams } from "@/features/e-service/models/search-params";

import { useHasRole } from "@/contexts/auth";

import { ConsumptionEserviceCard } from "./ConsumptionEserviceCard";
import { ConsumptionEserviceFilters } from "./ConsumptionEserviceFilters";

export function ConsumptionEserviceList({
  agreementState,
  eservices,
  isLoading,
  onAgreementStateChange,
}: {
  agreementState: ConsumptionEserviceListParams["agreementState"];
  eservices: bffApi.ConsumerEservice[];
  isLoading: boolean;
  onAgreementStateChange: (
    state: ConsumptionEserviceListParams["agreementState"],
  ) => void;
}) {
  const canManageAgreements = useHasRole("administrative");
  const hasFilters = agreementState !== undefined;
  const showContent = isLoading || hasFilters || eservices.length > 0;

  if (!showContent) {
    return (
      <Empty
        description={
          canManageAgreements
            ? "Search for an E-Service to request an Agreement."
            : "Consumed E-Services will appear here."
        }
        icon={<SelectionPlusIcon />}
        kind="brand-soft"
        title="You don't consume any E-Service yet."
      />
    );
  }

  const filters = (
    <ConsumptionEserviceFilters
      agreementState={agreementState}
      onAgreementStateChange={onAgreementStateChange}
    />
  );

  if (isLoading) {
    return (
      <>
        {filters}
        <Loader className="mx-auto mt-20" label="Loading..." />
      </>
    );
  }

  if (eservices.length === 0) {
    return (
      <>
        {filters}
        <Empty
          icon={<SelectionPlusIcon />}
          kind="brand-soft"
          title="No E-Services match the selected filters."
        />
      </>
    );
  }

  return (
    <>
      {filters}
      <ul className="flex flex-col gap-4" role="list">
        {eservices.map((eservice) => (
          <li key={eservice.id}>
            <ConsumptionEserviceCard eservice={eservice} />
          </li>
        ))}
      </ul>
    </>
  );
}
