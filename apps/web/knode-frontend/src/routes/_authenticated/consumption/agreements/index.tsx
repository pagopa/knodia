import { getConsumerAgreementCountersOptions } from "@knodia/bff-client/tanstack-query";
import { Empty, Loader } from "@knodia/ui-kit/ui";
import { SelectionPlusIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
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
  offset: z.number().int().min(0).default(0).catch(0),
});

export const Route = createFileRoute("/_authenticated/consumption/agreements/")(
  {
    component: RouteComponent,
    loaderDeps: ({ search: { offset } }) => ({ offset }),
    // eslint-disable-next-line perfectionist/sort-objects
    loader: async ({ context: { queryClient }, deps: { offset } }) => {
      await Promise.all([
        queryClient.ensureQueryData(
          getConsumerAgreementCountersOptions({ client }),
        ),
        queryClient.ensureQueryData(pendingConsumerAgreementsQuery(offset)),
      ]);
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
  const { data: countersData } = useSuspenseQuery(
    getConsumerAgreementCountersOptions({ client }),
  );

  const { data: pendingData } = useSuspenseQuery(
    pendingConsumerAgreementsQuery(offset),
  );

  const isStaleOffset =
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
      0 || pendingData.pagination.total > 0;

  return (
    <ListPageLayout
      pagination={{
        limit: pendingData.pagination.limit,
        offset,
        onOffsetChange,
        totalItems: pendingData.pagination.total,
      }}
    >
      <PageHeader overline="Consumption" title="Agreements" />
      {renderBody()}
    </ListPageLayout>
  );

  function renderBody() {
    if (isStaleOffset) {
      return <Loader className="mx-auto mt-10" label="Loading..." />;
    }

    if (!hasAgreements) {
      return <EmptyAgreementsState />;
    }

    return (
      <>
        <ConsumerAgreementsSummary counters={counters} />

        <h2 className="title-lg-em text-primary-light-high-contrast mt-10 mb-6">
          Action needed
        </h2>

        <PendingAgreementList agreements={pendingData.results} />
      </>
    );
  }
}

function EmptyAgreementsState() {
  const navigate = useNavigate();
  const canManageAgreements = useHasRole("administrative");

  return (
    <Empty
      action={
        canManageAgreements
          ? {
              as: "button",
              hierarchy: "brand",
              kind: "filled",
              label: "Search new E-Services",
              onClick: () => navigate({ to: "/consumption/e-services/search" }),
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
