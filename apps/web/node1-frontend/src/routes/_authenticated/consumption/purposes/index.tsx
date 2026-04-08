import { ButtonLink, Pagination } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { ConsumerPurposeTable } from "@/features/purpose/components/ConsumerPurposeTable/ConsumerPurposeTable";
import {
  purposeListSearchDefaultValues,
  purposeListSearchSchema,
} from "@/features/purpose/models/search-params";
import { consumerPurposesQuery } from "@/features/purpose/services/queries";

export const Route = createFileRoute("/_authenticated/consumption/purposes/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(consumerPurposesQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(purposeListSearchDefaultValues)],
  },
  validateSearch: purposeListSearchSchema,
});

function RouteComponent() {
  const { offset } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery({
    ...consumerPurposesQuery(offset),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        actions={
          <ButtonLink
            hierarchy="neutral"
            href={{ to: "/consumption/purposes/archive" }}
            kind="ghost"
          >
            <ArchiveIcon />
            Archive
          </ButtonLink>
        }
        overline="Consumption"
        title="Purposes"
      />

      <ConsumerPurposeTable
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
