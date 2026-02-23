import { Banner, Breadcrumb, Breadcrumbs, Empty } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { ConsumptionEserviceSearchFilters } from "@/features/e-service/components/ConsumptionEserviceSearchFilters";
import {
  consumptionEserviceSearchDefaultValues,
  consumptionEserviceSearchSchema,
} from "@/features/e-service/models/search-params";

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

  const handleSearch = (params: Omit<typeof search, "offset">) => {
    if (hasValidationError) setHasValidationError(false);
    navigate({ replace: true, search: { ...params, offset: 0 } });
  };

  const handleValidationError = () => {
    setHasValidationError(true);
  };

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>Search New E-Services</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Search New E-Services" />

      <ConsumptionEserviceSearchFilters
        defaultValues={{
          category: search.category,
          keywords: search.keywords,
          knode: search.knode,
        }}
        onSubmit={handleSearch}
        onValidationError={handleValidationError}
      />

      {hasValidationError ? (
        <Banner kind="error">
          To search for an E-Service, you should select a Knode and add a
          category or a keyword.
        </Banner>
      ) : (
        <Empty
          description="Search the E-Services in a Knode that match a category or a keyword"
          icon={<MagnifyingGlassIcon />}
        />
      )}
    </>
  );
}
