import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { SearchContent } from "@/features/e-service/components/ConsumptionEserviceSearch/SearchContent";
import { SearchFilters } from "@/features/e-service/components/ConsumptionEserviceSearch/SearchFilters";
import {
  consumptionEserviceSearchDefaultValues,
  consumptionEserviceSearchSchema,
} from "@/features/e-service/models/search-params";

import { searchConsumptionEservices } from "./consumption-eservice-search.mock";

export const Route = createFileRoute("/consumption/e-services_/search")({
  component: RouteComponent,
  search: {
    middlewares: [stripSearchParams(consumptionEserviceSearchDefaultValues)],
  },
  validateSearch: consumptionEserviceSearchSchema,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [hasValidationError, setHasValidationError] = useState(false);

  const hasSearched = Boolean(
    search.knode && (search.category || search.keywords),
  );

  const results = useMemo(() => {
    if (!hasSearched) return null;
    return searchConsumptionEservices({
      category: search.category,
      keywords: search.keywords,
      offset: search.offset,
    });
  }, [hasSearched, search.category, search.keywords, search.offset]);

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
        offset={search.offset}
        onOffsetChange={handleOffsetChange}
        results={results}
      />
    </div>
  );
}
