import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ConsumerArchivedAgreementTable } from "@/features/agreement/components/ConsumerArchivedAgreementTable/ConsumerArchivedAgreementTable";
import { archivedConsumerAgreementsQuery } from "@/features/agreement/services/queries";

const archivedAgreementsSearchDefaultValues = { offset: 0 };

const archivedAgreementsSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(archivedAgreementsSearchDefaultValues.offset)
    .catch(archivedAgreementsSearchDefaultValues.offset),
});

export const Route = createFileRoute(
  "/_authenticated/consumption/agreements/archive",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(archivedConsumerAgreementsQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(archivedAgreementsSearchDefaultValues)],
  },
  validateSearch: archivedAgreementsSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...archivedConsumerAgreementsQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) => navigate({ search: { offset } }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/agreements" }}>
          Agreements
        </Breadcrumb>
        <Breadcrumb>Archived</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Archived" />

      <ConsumerArchivedAgreementTable
        agreements={data?.results ?? []}
        isLoading={isLoading}
      />
    </ListPageLayout>
  );
}
