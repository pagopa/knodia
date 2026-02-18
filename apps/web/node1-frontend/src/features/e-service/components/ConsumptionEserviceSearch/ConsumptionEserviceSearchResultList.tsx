import { Empty, Loader } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/routes/consumption/e-services_/consumption-eservice-search.mock";

import { ConsumptionEserviceSearchResultCard } from "./ConsumptionEserviceSearchResultCard";

export function ConsumptionEserviceSearchResultList({
  eservices,
  isLoading,
}: {
  eservices: ConsumptionEserviceSearchResult[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <Loader className="mx-auto mt-20" label="Loading..." />;
  }

  if (eservices.length === 0) {
    return (
      <Empty
        description="Try with different filters."
        icon={<MagnifyingGlassIcon />}
        title="No results found for your search."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4" role="list">
      {eservices.map((eservice) => (
        <li key={eservice.id}>
          <ConsumptionEserviceSearchResultCard eservice={eservice} />
        </li>
      ))}
    </ul>
  );
}
