import { getConsumerAgreementsOptions } from "@knodia/bff-client/tanstack-query";
import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  stripSearchParams,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
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

export function ConsumerAgreementsPage({
  offset,
  onOffsetChange,
}: {
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
  const navigate = useNavigate();
  const canManageAgreements = useHasRole("administrative");

  const { data: countersData } = useSuspenseQuery(
    getConsumerAgreementsOptions({ client }),
  );

  const { data: pendingData } = useQuery({
    ...pendingConsumerAgreementsQuery(offset),
    placeholderData: keepPreviousData,
  });

  const isStaleOffset =
    pendingData !== undefined &&
    pendingData.results.length === 0 &&
    pendingData.pagination.total > 0 &&
    offset > 0;

  useEffect(() => {
    if (isStaleOffset) {
      onOffsetChange(0);
    }
  }, [isStaleOffset, onOffsetChange]);

  const { counters } = countersData;
  const hasAgreements =
    counters.activeAgreements +
      counters.suspendedAgreements +
      counters.archivedAgreements >
      0 || (pendingData?.pagination.total ?? 0) > 0;

  return (
    <ListPageLayout
      pagination={{
        limit: pendingData?.pagination.limit ?? 0,
        offset,
        onOffsetChange,
        totalItems: pendingData?.pagination.total ?? 0,
      }}
    >
      <PageHeader overline="Consumption" title="Agreements" />

      {pendingData === undefined || isStaleOffset ? (
        <Loader className="mx-auto mt-10" label="Loading..." />
      ) : hasAgreements ? (
        <>
          <ConsumerAgreementsSummary counters={counters} />

          <h2 className="title-lg-em text-primary-light-high-contrast mt-10 mb-6">
            Action needed
          </h2>

          <PendingAgreementList agreements={pendingData.results} />
        </>
      ) : (
        <Empty
          action={
            canManageAgreements
              ? {
                  as: "button",
                  hierarchy: "brand",
                  kind: "filled",
                  label: "Search new E-Services",
                  onClick: () =>
                    navigate({ to: "/consumption/e-services/search" }),
                }
              : undefined
          }
          description={
            canManageAgreements
              ? "Search for an E-Service to request an Agreement."
              : undefined
          }
          icon={<SelectionPlusIcon />}
          title="You don't have any Agreements yet."
        />
      )}
    </ListPageLayout>
  );
}

function RouteComponent() {
  const { offset } = Route.useSearch();
  const routeNavigate = Route.useNavigate();

  return (
    <ConsumerAgreementsPage
      offset={offset}
      onOffsetChange={(nextOffset) =>
        routeNavigate({
          replace: true,
          search: (s) => ({ ...s, offset: nextOffset }),
        })
      }
    />
  );
}
