import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { ProducerPurposeTable } from "@/features/purpose/components/ProducerPurposeTable/ProducerPurposeTable";
import {
  producerPurposeSearchDefaultValues,
  producerPurposeSearchSchema,
} from "@/features/purpose/models/search-params";
import { producerPurposesQuery } from "@/features/purpose/services/queries";

export const Route = createFileRoute("/_authenticated/production/purposes/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(producerPurposesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(producerPurposeSearchDefaultValues)],
  },
  validateSearch: producerPurposeSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...producerPurposesQuery(offset),
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
      <PageHeader overline="Production" title="Purposes" />

      <ProducerPurposeTable
        isLoading={isLoading}
        purposes={data?.results ?? []}
      />
    </ListPageLayout>
  );
}
