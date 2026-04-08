import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { SearchContent } from "@/features/e-service/components/ConsumptionEserviceSearch/SearchContent";
import { SearchFilters } from "@/features/e-service/components/ConsumptionEserviceSearch/SearchFilters";
import {
  consumptionEserviceSearchDefaultValues,
  type ConsumptionEserviceSearchParams,
  consumptionEserviceSearchSchema,
} from "@/features/e-service/models/search-params";
import { toCatalogSearchResultUI } from "@/features/e-service/services/api-converters";
import { buildCatalogSearchBody } from "@/features/e-service/services/buildCatalogSearchBody";
import { consumerCatalogEservicesQuery } from "@/features/e-service/services/queries";
import { requireRole } from "@/libs/routeGuards";

const isSearchReady = (
  params: Omit<ConsumptionEserviceSearchParams, "offset">,
): boolean =>
  params.knodeId !== "" && (params.category !== "" || params.keywords !== "");

export const Route = createFileRoute(
  "/_authenticated/consumption/e-services/search",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { category, keywords, knodeId, offset } }) => ({
    category,
    keywords,
    knodeId,
    offset,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context, deps }) => {
    requireRole(context, "administrative");
    if (!isSearchReady(deps)) return;
    const body = buildCatalogSearchBody({
      category: deps.category,
      keywords: deps.keywords,
      knodeId: deps.knodeId,
    });
    context.queryClient.prefetchQuery(
      consumerCatalogEservicesQuery(body, deps.offset),
    );
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

  const searchReady = isSearchReady(search);

  const body = buildCatalogSearchBody({
    category: search.category,
    keywords: search.keywords,
    knodeId: search.knodeId,
  });

  const { data: results, isLoading } = useQuery({
    ...consumerCatalogEservicesQuery(body, search.offset),
    enabled: searchReady,
    placeholderData: searchReady ? keepPreviousData : undefined,
    select: (data) => ({
      items: data.results.map(toCatalogSearchResultUI),
      pagination: data.pagination,
    }),
  });

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
    <ListPageLayout
      pagination={{
        limit: results?.pagination.limit ?? 0,
        offset: results?.pagination.offset ?? 0,
        onOffsetChange: handleOffsetChange,
        totalItems: results?.pagination.total ?? 0,
      }}
    >
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
          knodeId: search.knodeId,
        }}
        onSubmit={handleSearch}
        onValidationError={handleValidationError}
      />

      <SearchContent
        hasValidationError={hasValidationError}
        isLoading={isLoading}
        knodeId={search.knodeId}
        results={results ? { items: results.items } : null}
      />
    </ListPageLayout>
  );
}
