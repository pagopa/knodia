import { ButtonLink, Empty, Pagination } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { ConsumptionEserviceFilters } from "@/features/e-service/components/ConsumptionEserviceFilters";
import { ConsumptionEserviceList } from "@/features/e-service/components/ConsumptionEserviceList";
import {
  consumptionEserviceListDefaultValues,
  consumptionEserviceListSchema,
} from "@/features/e-service/models/search-params";
import { consumerEservicesQuery } from "@/features/e-service/services/queries";

export const Route = createFileRoute("/_authenticated/consumption/e-services/")(
  {
    component: RouteComponent,
    loaderDeps: ({ search: { agreementState, offset } }) => ({
      agreementState,
      offset,
    }),
    // eslint-disable-next-line perfectionist/sort-objects
    loader: ({
      context: { queryClient },
      deps: { agreementState, offset },
    }) => {
      queryClient.prefetchQuery(consumerEservicesQuery(offset, agreementState));
    },
    search: {
      middlewares: [stripSearchParams(consumptionEserviceListDefaultValues)],
    },
    validateSearch: consumptionEserviceListSchema,
  },
);

function RouteComponent() {
  const canManageAgreements = useHasRole("administrative");
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...consumerEservicesQuery(search.offset, search.agreementState),
    placeholderData: keepPreviousData,
  });

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  const eservices = data?.results ?? [];
  const hasFilters = search.agreementState !== undefined;
  const showContent = isLoading || hasFilters || eservices.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        actions={
          canManageAgreements && (
            <ButtonLink
              hierarchy="brand"
              href={{ to: "/consumption/e-services/search" }}
            >
              Search new E-Services
            </ButtonLink>
          )
        }
        overline="Consumption"
        title="E-Services"
      />

      {showContent ? (
        <>
          <ConsumptionEserviceFilters
            agreementState={search.agreementState}
            onAgreementStateChange={(state) => {
              if (state !== search.agreementState) {
                handleSearchChange({ agreementState: state, offset: 0 });
              }
            }}
          />

          <ConsumptionEserviceList
            eservices={eservices}
            isLoading={isLoading}
          />

          <Pagination
            className="mx-auto mt-auto pt-6"
            limit={data?.pagination.limit ?? 0}
            offset={search.offset}
            onOffsetChange={(offset) => handleSearchChange({ offset })}
            totalItems={data?.pagination.total ?? 0}
          />
        </>
      ) : (
        <Empty
          description={
            canManageAgreements
              ? "Search for an E-Service to request an Agreement."
              : "Consumed E-Services will appear here."
          }
          icon={<SelectionPlusIcon />}
          title="You don't consume any E-Service yet."
        />
      )}
    </div>
  );
}
