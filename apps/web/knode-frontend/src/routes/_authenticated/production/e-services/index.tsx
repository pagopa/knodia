import { Button, Menu, MenuItem, MenuTrigger } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
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
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) => handleSearchChange({ offset }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <PageHeader
        actions={
          <>
            <ButtonLinkWithPreload
              hierarchy="neutral"
              kind="ghost"
              to="/production/e-services/archive"
            >
              <ArchiveIcon />
              Archive
            </ButtonLinkWithPreload>
            {canPublishEservices && (
              <MenuTrigger>
                <Button hierarchy="brand">Create E-Service</Button>

                <Menu>
                  <MenuItem
                    onAction={() => {
                      navigate({ to: "/production/e-services/new" });
                    }}
                  >
                    From scratch
                  </MenuItem>
                  <MenuItem
                    onAction={() => {
                      navigate({
                        to: "/production/e-services/from-template",
                      });
                    }}
                  >
                    From template
                  </MenuItem>
                </Menu>
              </MenuTrigger>
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
    </ListPageLayout>
  );
}
