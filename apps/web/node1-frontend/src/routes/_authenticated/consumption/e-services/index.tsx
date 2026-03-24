import { getConsumerEservicesOptions } from "@knodia/bff-client/tanstack-query";
import { ButtonLink, Empty, Pagination } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ConsumptionEserviceFilters } from "@/features/e-service/components/ConsumptionEserviceFilters";
import { ConsumptionEserviceList } from "@/features/e-service/components/ConsumptionEserviceList";
import {
  consumptionEserviceListDefaultValues,
  type ConsumptionEserviceListParams,
  consumptionEserviceListSchema,
} from "@/features/e-service/models/search-params";
import { client } from "@/libs/axios";

const ESERVICES_PAGE_LIMIT = 10;

const eservicesQuery = (
  offset: number,
  agreementState: ConsumptionEserviceListParams["agreementState"],
) =>
  getConsumerEservicesOptions({
    client,
    query: { agreementState, limit: ESERVICES_PAGE_LIMIT, offset },
  });

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
      queryClient.prefetchQuery(eservicesQuery(offset, agreementState));
    },
    search: {
      middlewares: [stripSearchParams(consumptionEserviceListDefaultValues)],
    },
    validateSearch: consumptionEserviceListSchema,
  },
);

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...eservicesQuery(search.offset, search.agreementState),
    placeholderData: keepPreviousData,
  });

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  const eservices = data?.items ?? [];
  const hasFilters = search.agreementState !== undefined;
  const showContent = isLoading || hasFilters || eservices.length > 0;

  return (
    <>
      <PageHeader
        actions={
          <ButtonLink
            hierarchy="brand"
            href={{ to: "/consumption/e-services/search" }}
          >
            Search new E-Services
          </ButtonLink>
        }
        overline="Consumption"
        title="E-Services"
      />

      {showContent ? (
        <>
          <ConsumptionEserviceFilters
            agreementState={search.agreementState}
            onAgreementStateChange={(state) =>
              handleSearchChange({ agreementState: state, offset: 0 })
            }
          />

          <ConsumptionEserviceList
            eservices={eservices}
            hasFilters={hasFilters}
            isLoading={isLoading}
          />

          <Pagination
            className="mx-auto mt-6"
            limit={data?.pagination.limit ?? 0}
            offset={search.offset}
            onOffsetChange={(offset) => handleSearchChange({ offset })}
            totalItems={data?.pagination.total ?? 0}
          />
        </>
      ) : (
        <Empty
          description="Search for an E-Service to request an Agreement."
          icon={<SelectionPlusIcon />}
          title="You don't consume any E-Service yet."
        />
      )}
    </>
  );
}
