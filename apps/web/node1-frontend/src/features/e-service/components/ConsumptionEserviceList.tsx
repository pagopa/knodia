import type { bffApi } from "@knodia/bff-client";

import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";

import { ConsumptionEserviceCard } from "./ConsumptionEserviceCard";

export function ConsumptionEserviceList({
  eservices,
  hasFilters,
  isLoading,
}: {
  eservices: bffApi.ConsumerEservice[];
  hasFilters: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (eservices.length === 0 && hasFilters) {
    return (
      // TODO: Replace with final copy
      <Empty
        icon={<SelectionPlusIcon />}
        title="No E-Services match the selected filters."
      />
    );
  }

  if (eservices.length === 0) {
    return (
      <Empty
        description="Search for an E-Service to request an Agreement."
        icon={<SelectionPlusIcon />}
        title="You don't consume any E-Service yet."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {eservices.map((eservice) => (
        <li key={eservice.id}>
          <ConsumptionEserviceCard eservice={eservice} />
        </li>
      ))}
    </ul>
  );
}
