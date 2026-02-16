import { Breadcrumb, Breadcrumbs, Empty } from "@knodia/ui-kit/ui";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";

import type { ConsumptionEserviceSearchParams } from "@/features/e-service/models/search-params";

import { PageHeader } from "@/components/PageHeader";
import { ConsumptionEserviceSearchFilters } from "@/features/e-service/components/ConsumptionEserviceSearchFilters";

export const Route = createFileRoute("/consumption/e-services_/search")({
  component: RouteComponent,
});

function RouteComponent() {
  const handleSearch = (params: ConsumptionEserviceSearchParams) => {
    // TODO: Implement search logic
    console.log("Search with filters:", params);
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

      <ConsumptionEserviceSearchFilters onSubmit={handleSearch} />

      <Empty
        description="Search the E-Services in a Knode that match a category or a keyword"
        icon={<MagnifyingGlassIcon />}
      />
    </>
  );
}
