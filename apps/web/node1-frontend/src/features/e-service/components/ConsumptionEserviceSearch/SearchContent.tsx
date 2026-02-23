import { Banner, Empty, Pagination } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/routes/consumption/e-services_/consumption-eservice-search.mock";

import { SearchResultList } from "./SearchResultList";

export function SearchContent({
  hasValidationError,
  onOffsetChange,
  results,
}: {
  hasValidationError: boolean;
  onOffsetChange: (offset: number) => void;
  results: null | {
    items: ConsumptionEserviceSearchResult[];
    pagination: { limit: number; offset: number; total: number };
  };
}) {
  if (hasValidationError) {
    return (
      <Banner kind="error">
        To search for an E-Service, you should select a Knode and add a category
        or a keyword.
      </Banner>
    );
  }

  if (!results) {
    return (
      <Empty
        description="Search the E-Services in a Knode that match a category or a keyword"
        icon={<MagnifyingGlassIcon />}
      />
    );
  }

  return (
    <>
      <SearchResultList
        eservices={results.items}
        isLoading={false} // TODO: Replace with isLoading from useQuery when BFF endpoint is available
      />
      <Pagination
        className="mx-auto mt-auto pt-6"
        limit={results.pagination.limit}
        offset={results.pagination.offset}
        onOffsetChange={onOffsetChange}
        totalItems={results.pagination.total}
      />
    </>
  );
}
