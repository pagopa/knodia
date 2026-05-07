import { Breadcrumb, Breadcrumbs } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ProducerArchivedPurposeTable } from "@/features/purpose/components/ProducerArchivedPurposeTable/ProducerArchivedPurposeTable";
import {
  archivedPurposesSearchDefaultValues,
  archivedPurposesSearchSchema,
} from "@/features/purpose/models/search-params";
import { producerArchivedPurposesQuery } from "@/features/purpose/services/queries";

export const Route = createFileRoute(
  "/_authenticated/production/purposes/archive",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(producerArchivedPurposesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(archivedPurposesSearchDefaultValues)],
  },
  validateSearch: archivedPurposesSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...producerArchivedPurposesQuery(offset),
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
        <Breadcrumb href={{ to: "/production/purposes" }}>Purposes</Breadcrumb>
        <Breadcrumb>Archive</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        description="Here are your E-Service Purposes, archived by the Consumer."
        title="Archive"
      />

      <ProducerArchivedPurposeTable
        isLoading={isLoading}
        purposes={data?.results ?? []}
      />
    </ListPageLayout>
  );
}
