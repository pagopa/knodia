import { Banner, Empty } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";

import type { ConsumptionEserviceSearchResult } from "@/features/e-service/models/consumption-eservice-search";

import { SearchResultList } from "./SearchResultList";

export function SearchContent({
  hasValidationError,
  isLoading,
  knodeId,
  results,
}: {
  hasValidationError: boolean;
  isLoading: boolean;
  knodeId: string;
  results: null | {
    items: ConsumptionEserviceSearchResult[];
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
    <SearchResultList
      eservices={results.items}
      isLoading={isLoading}
      knodeId={knodeId}
    />
  );
}
