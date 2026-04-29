import { Breadcrumb, Breadcrumbs, Empty } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { ArchivedConsumerPurposeTable } from "@/features/purpose/components/ArchivedConsumerPurposeTable";
import { consumerArchivedPurposesQuery } from "@/features/purpose/services/queries";

const archivedPurposesSearchDefaultValues = { offset: 0 };

const archivedPurposesSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(archivedPurposesSearchDefaultValues.offset)
    .catch(archivedPurposesSearchDefaultValues.offset),
});

export const Route = createFileRoute(
  "/_authenticated/consumption/purposes/archive",
)({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(consumerArchivedPurposesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(archivedPurposesSearchDefaultValues)],
  },
  validateSearch: archivedPurposesSearchSchema,
});

function RouteComponent() {
  const canManagePurposes = useHasRole("administrative");
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...consumerArchivedPurposesQuery(offset),
    placeholderData: keepPreviousData,
  });

  const isEmpty = !isLoading && data?.results.length === 0;

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
        <Breadcrumb isDisabled>Consumption</Breadcrumb>
        <Breadcrumb href={{ to: "/consumption/purposes" }}>Purposes</Breadcrumb>
        <Breadcrumb>Archive</Breadcrumb>
      </Breadcrumbs>

      <PageHeader title="Archive" />

      {isEmpty ? (
        <Empty
          description="Archived Purposes will appear here."
          icon={<ArchiveIcon />}
          title={
            canManagePurposes
              ? "You haven't archived any Purpose yet."
              : "There are no archived Purposes."
          }
        />
      ) : (
        <ArchivedConsumerPurposeTable
          isLoading={isLoading}
          purposes={data?.results ?? []}
        />
      )}
    </ListPageLayout>
  );
}
