import { Empty, Loader } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/features/e-service/models/consumption-eservice-search";

import { SearchResultCard } from "./SearchResultCard";

export function SearchResultList({
  eservices,
  isLoading,
  knodeId,
}: {
  eservices: ConsumptionEserviceSearchResult[];
  isLoading: boolean;
  knodeId: string;
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
          <SearchResultCard eservice={eservice} knodeId={knodeId} />
        </li>
      ))}
    </ul>
  );
}
