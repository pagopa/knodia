import { getConsumerAgreementsOptions } from "@knodia/bff-client/tanstack-query";
import { Pagination } from "@knodia/ui-kit/ui";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

import { PageHeader } from "@/components/PageHeader";
import { ConsumerAgreementsSummary } from "@/features/agreement/components/ConsumerAgreementsSummary";
import { PendingAgreementList } from "@/features/agreement/components/PendingAgreementList/PendingAgreementList";
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
      await Promise.all([
        queryClient.ensureQueryData(getConsumerAgreementsOptions({ client })),
        queryClient.ensureQueryData(pendingConsumerAgreementsQuery(offset)),
      ]);
    },
    search: {
      middlewares: [stripSearchParams({ offset: 0 })],
      validators: [searchSchema],
    },
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

  const hasPendingAgreements = (pendingData?.pagination.total ?? 0) > 0;

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader overline="Consumption" title="Agreements" />

      <ConsumerAgreementsSummary
        counters={countersData.counters}
        hasPendingAgreements={hasPendingAgreements}
      />

      <h2 className="title-lg-em text-primary-light-high-contrast mt-10 mb-6">
        Action needed
      </h2>

      <PendingAgreementList
        agreements={pendingData?.results ?? []}
        isLoading={isLoading}
      />

      {hasPendingAgreements && (
        <Pagination
          className="mx-auto mt-auto pt-6"
          limit={pendingData?.pagination.limit ?? 0}
          offset={offset}
          onOffsetChange={(offset) =>
            navigate({ replace: true, search: (s) => ({ ...s, offset }) })
          }
          totalItems={pendingData?.pagination.total ?? 0}
        />
      )}
    </div>
  );
}
