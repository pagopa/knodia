import { Button, Pagination } from "@knodia/ui-kit/ui";
import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import {
  keychainSearchDefaultValues,
  keychainSearchSchema,
} from "@/features/keychain/models/search-params";

// TODO: This is a mock
const keychainsQuery = (offset: number) =>
  queryOptions({
    queryFn: async () =>
      Promise.resolve({
        items: [],
        pagination: { limit: 10, offset, total: 0 },
      }),
    queryKey: ["keychains", offset],
  });

export const Route = createFileRoute("/_authenticated/keychains")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({ offset }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(keychainsQuery(offset));
  },
  search: {
    middlewares: [stripSearchParams(keychainSearchDefaultValues)],
  },
  validateSearch: keychainSearchSchema,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { offset } = search;

  const { data, isLoading } = useQuery({
    ...keychainsQuery(offset),
    placeholderData: keepPreviousData,
  });

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button hierarchy="brand" kind="filled" size="md">
              Create Keychain
            </Button>
          </>
        }
        title="Keychains"
      />

      <KeychainTable isLoading={isLoading} keychains={data?.items ?? []} />

      <Pagination
        className="mx-auto mt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={(offset) => handleSearchChange({ offset })}
        totalItems={data?.pagination.total ?? 0}
      />
    </>
  );
}
