import { getEservicesOptions } from "@knodia/bff-client/tanstack-query";
import { Button, Empty, Pagination } from "@knodia/ui-kit/ui";
import { ArchiveIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ProductionEserviceFilters } from "@/features/e-service/components/ProductionEserviceFilters";
import { ProductionEserviceList } from "@/features/e-service/components/ProductionEserviceList";
import {
  productionEserviceSearchDefaultValues,
  productionEserviceSearchSchema,
} from "@/features/e-service/models/search-params";
import { client } from "@/libs/axios";

const eservicesQuery = (offset: number) =>
  getEservicesOptions({
    client,
    query: { limit: 10, offset },
  });

export const Route = createFileRoute("/production/e-services")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: async ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.ensureQueryData(eservicesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(productionEserviceSearchDefaultValues)],
  },
  validateSearch: productionEserviceSearchSchema,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { offset, ...filterDefaultValues } = search;

  const { data, isLoading } = useQuery({
    ...eservicesQuery(offset),
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
            <Button hierarchy="brand">Create E-Service</Button>
          </>
        }
        subtitle="Production"
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

      {(isLoading || !data) && <div>Loading...</div>}

      {data && data.items.length > 0 && (
        <ProductionEserviceList eservices={data.items} />
      )}

      {data && data.items.length === 0 && (
        <div className="flex justify-center">
          <Empty
            description="Create your first one"
            icon={<SelectionPlusIcon />}
            title="You don't have any E-Services yet"
          />
        </div>
      )}

      <div className="flex">
        <Pagination
          className="mx-auto mt-6"
          limit={data?.pagination.limit ?? 0}
          offset={offset}
          onOffsetChange={(offset) => handleSearchChange({ offset })}
          totalItems={data?.pagination.total ?? 0}
        />
      </div>
    </>
  );
}
