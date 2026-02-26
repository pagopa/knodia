import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { SearchContent } from "@/features/e-service/components/ConsumptionEserviceSearch/SearchContent";
import { SearchFilters } from "@/features/e-service/components/ConsumptionEserviceSearch/SearchFilters";
import {
  consumptionEserviceSearchDefaultValues,
  consumptionEserviceSearchSchema,
} from "@/features/e-service/models/search-params";
import { toCatalogSearchResultUI } from "@/features/e-service/services/api-converters";
import { buildCatalogSearchBody } from "@/features/e-service/services/buildCatalogSearchBody";
import { getConsumerCatalogEservicesQueryOptions } from "@/features/e-service/services/catalogEservicesQuery";
import { client } from "@/libs/axios";

const CATALOG_SEARCH_LIMIT = 4;

const catalogQuery = (
  body: ReturnType<typeof buildCatalogSearchBody>,
  offset: number,
) =>
  getConsumerCatalogEservicesQueryOptions({
    body,
    client,
    query: { limit: CATALOG_SEARCH_LIMIT, offset },
  });

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services_/search",
)({
  component: RouteComponent,
  loaderDeps: ({ search }) => search,
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps }) => {
    if (!deps.knode) return;

    const body = buildCatalogSearchBody({
      category: deps.category,
      keywords: deps.keywords,
      knodeId: deps.knode,
    });
    queryClient.prefetchQuery(catalogQuery(body, deps.offset));
  },
  search: {
    middlewares: [stripSearchParams(consumptionEserviceSearchDefaultValues)],
  },
  validateSearch: consumptionEserviceSearchSchema,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [hasValidationError, setHasValidationError] = useState(false);

  const canSearch = !!search.knode;

  const body = buildCatalogSearchBody({
    category: search.category,
    keywords: search.keywords,
    knodeId: search.knode,
  });

  const { data, isLoading } = useQuery({
    ...catalogQuery(body, search.offset),
    enabled: canSearch,
    placeholderData: canSearch ? keepPreviousData : undefined,
  });

  const results = data
    ? {
        items: data.results.map(toCatalogSearchResultUI),
        pagination: data.pagination,
      }
    : null;

  const handleSearch = (params: Omit<typeof search, "offset">) => {
    if (hasValidationError) setHasValidationError(false);
    navigate({ replace: true, search: { ...params, offset: 0 } });
  };

  const handleOffsetChange = (offset: number) => {
    navigate({ replace: true, search: (s) => ({ ...s, offset }) });
  };

  const handleValidationError = () => {
    setHasValidationError(true);
  };

  return (
    <div className="flex min-h-full flex-col">
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>Search New E-Services</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Search New E-Services" />

      <SearchFilters
        defaultValues={{
          category: search.category,
          keywords: search.keywords,
          knode: search.knode,
        }}
        onSubmit={handleSearch}
        onValidationError={handleValidationError}
      />

      <SearchContent
        hasValidationError={hasValidationError}
        isLoading={isLoading}
        onOffsetChange={handleOffsetChange}
        results={results}
      />
    </div>
  );
}
