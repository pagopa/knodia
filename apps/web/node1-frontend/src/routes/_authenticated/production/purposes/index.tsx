import { Pagination } from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

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
    <div className="flex min-h-full flex-col">
      <PageHeader overline="Production" title="Purposes" />

      <ProducerPurposeTable
        isLoading={isLoading}
        purposes={data?.results ?? []}
      />

      <Pagination
        className="mx-auto mt-auto pt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={(offset) =>
          navigate({ replace: true, search: (s) => ({ ...s, offset }) })
        }
        totalItems={data?.pagination.total ?? 0}
      />
    </div>
  );
}
