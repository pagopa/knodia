import { getConsumerEservicesOptions } from "@knodia/bff-client/tanstack-query";
import { ButtonLink, Pagination } from "@knodia/ui-kit/ui";
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

export const Route = createFileRoute("/_authenticated/consumption/e-services")({
  component: RouteComponent,
  loaderDeps: ({ search: { agreementState, offset } }) => ({
    agreementState,
    offset,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { agreementState, offset } }) => {
    queryClient.prefetchQuery(eservicesQuery(offset, agreementState));
  },
  search: {
    middlewares: [stripSearchParams(consumptionEserviceListDefaultValues)],
  },
  validateSearch: consumptionEserviceListSchema,
});

function RouteComponent() {
  const { agreementState, offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...eservicesQuery(offset, agreementState),
    placeholderData: keepPreviousData,
  });

  function handleSearchChange(values: Partial<ConsumptionEserviceListParams>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  const eservices = data?.items ?? [];

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

      <ConsumptionEserviceFilters
        agreementState={agreementState}
        onAgreementStateChange={(state) =>
          handleSearchChange({ agreementState: state, offset: 0 })
        }
      />

      <ConsumptionEserviceList eservices={eservices} isLoading={isLoading} />

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
