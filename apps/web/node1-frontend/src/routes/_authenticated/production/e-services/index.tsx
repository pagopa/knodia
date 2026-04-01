import { Button, ButtonLink, Pagination } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { ProductionEserviceFilters } from "@/features/e-service/components/ProductionEserviceFilters";
import { ProductionEserviceList } from "@/features/e-service/components/ProductionEserviceList";
import {
  productionEserviceSearchDefaultValues,
  productionEserviceSearchSchema,
} from "@/features/e-service/models/search-params";
import { producerEservicesQuery } from "@/features/e-service/services/queries";

export const Route = createFileRoute("/_authenticated/production/e-services/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(producerEservicesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(productionEserviceSearchDefaultValues)],
  },
  validateSearch: productionEserviceSearchSchema,
});

function RouteComponent() {
  const canPublishEservices = useHasRole("technical");
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { offset, ...filterDefaultValues } = search;

  const { data, isLoading } = useQuery({
    ...producerEservicesQuery(offset),
    placeholderData: keepPreviousData,
  });

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button hierarchy="neutral" kind="ghost">
              <ArchiveIcon />
              Archive
            </Button>
            {canPublishEservices && (
              <ButtonLink
                hierarchy="brand"
                href={{ to: "/production/e-services/new" }}
              >
                Create E-Service
              </ButtonLink>
            )}
          </>
        }
        overline="Production"
        title="E-Services"
      />
      {/*
        TODO: The filters are NTH. Let's leave them out for now.
        I leave the code in place and just not render it to keep knip happy and to not forget about it.
      */}
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && (
        <ProductionEserviceFilters
          defaultValues={filterDefaultValues}
          onDebouncedChange={handleSearchChange}
        />
      )}

      <ProductionEserviceList
        eservices={data?.results ?? []}
        isLoading={isLoading}
      />

      <Pagination
        className="mx-auto mt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={(offset) => handleSearchChange({ offset })}
        totalItems={data?.pagination.total ?? 0}
      />
    </>
  );
}
