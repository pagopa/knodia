import { getConsumerAgreementsOptions } from "@knodia/bff-client/tanstack-query";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ConsumerAgreementsSummary } from "@/features/agreement/components/ConsumerAgreementsSummary";
import { pendingConsumerAgreementsQuery } from "@/features/agreement/services/queries";
import { client } from "@/libs/axios";

const searchSchema = z.object({
  offset: z.number().int().min(0).default(0),
});

export const Route = createFileRoute("/_authenticated/consumption/agreements/")(
  {
    component: RouteComponent,
    loaderDeps: ({ search: { offset } }) => ({ offset }),
    // eslint-disable-next-line perfectionist/sort-objects
    loader: async ({ context: { queryClient }, deps: { offset } }) => {
      await queryClient.ensureQueryData(
        getConsumerAgreementsOptions({ client }),
      );
      queryClient.prefetchQuery(pendingConsumerAgreementsQuery(offset));
    },
    search: {
      middlewares: [stripSearchParams({ offset: 0 })],
    },
    validateSearch: searchSchema,
  },
);

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: countersData } = useSuspenseQuery(
    getConsumerAgreementsOptions({ client }),
  );

  const { data: pendingData, isLoading } = useQuery({
    ...pendingConsumerAgreementsQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <ListPageLayout
      pagination={{
        limit: pendingData?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) =>
          navigate({ replace: true, search: (s) => ({ ...s, offset }) }),
        totalItems: pendingData?.pagination.total ?? 0,
      }}
    >
      <PageHeader overline="Consumption" title="Agreements" />

      <ConsumerAgreementsSummary
        counters={countersData.counters}
        isLoadingPending={isLoading}
        pendingAgreements={pendingData?.results ?? []}
      />
    </ListPageLayout>
  );
}
