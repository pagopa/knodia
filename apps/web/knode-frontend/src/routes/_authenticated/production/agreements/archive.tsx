import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ProducerArchivedAgreementTable } from "@/features/agreement/components/ProducerArchivedAgreementTable/ProducerArchivedAgreementTable";
import { archivedProducerAgreementsQuery } from "@/features/agreement/services/queries";

const archivedAgreementsSearchDefaultValues = { offset: 0 };

const archivedAgreementsSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(archivedAgreementsSearchDefaultValues.offset)
    .catch(archivedAgreementsSearchDefaultValues.offset),
});

export const Route = createFileRoute(
  "/_authenticated/production/agreements/archive",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(archivedProducerAgreementsQuery(offset));
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
    ...archivedProducerAgreementsQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <ListPageLayout
      pagination={{
        limit: data?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) =>
          navigate({ replace: true, search: (s) => ({ ...s, offset }) }),
        totalItems: data?.pagination.total ?? 0,
      }}
    >
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/agreements" }}>
          Agreements
        </Breadcrumb>
        <Breadcrumb>Archive</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        description="Here are your E-Service Agreements, archived by the Consumer."
        title="Archive"
      />

      <ProducerArchivedAgreementTable
        agreements={data?.results ?? []}
        isLoading={isLoading}
      />
    </ListPageLayout>
  );
}
