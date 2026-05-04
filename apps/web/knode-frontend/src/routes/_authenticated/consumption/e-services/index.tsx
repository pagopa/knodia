import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ButtonLinkWithPreload } from "@/components/routerLinks";
import { useHasRole } from "@/contexts/auth";
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

  return (
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset: search.offset,
        onOffsetChange: (offset) => handleSearchChange({ offset }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <PageHeader
        actions={
          canManageAgreements && (
            <ButtonLinkWithPreload
              hierarchy="brand"
              to="/consumption/e-services/search"
            >
              Search new E-Services
            </ButtonLinkWithPreload>
          )
        }
        overline="Consumption"
        title="E-Services"
      />

      <ConsumptionEserviceList
        agreementState={search.agreementState}
        eservices={data?.results ?? []}
        isLoading={isLoading}
        onAgreementStateChange={(state) => {
          if (state !== search.agreementState) {
            handleSearchChange({ agreementState: state, offset: 0 });
          }
        }}
      />
    </ListPageLayout>
  );
}
