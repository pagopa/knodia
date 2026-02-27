import { Button, Pagination } from "@knodia/ui-kit/ui";
import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { CreateKeychainModal } from "@/features/keychain/components/CreateKeychainModal";
import { KeychainFilters } from "@/features/keychain/components/KeychainsFilters";
import { KeychainTable } from "@/features/keychain/components/KeychainTable";
import {
  keychainSearchDefaultValues,
  keychainSearchSchema,
} from "@/features/keychain/models/search-params";

const keychainsQuery = (offset: number) =>
  queryOptions({
    queryFn: async () =>
      Promise.resolve({
        items: Array.from({ length: 10 }).map((_, i) => ({
          id: `keychain-${i}`,
          name: `Mock Keychain ${i + 1 + offset}`,
          numKeys: Math.floor(Math.random() * 100),
          type: "Mock Type",
        })),
        pagination: { limit: 10, offset, total: 100 },
      }),
    queryKey: ["keychains", offset],
  });

export const Route = createFileRoute("/_authenticated/keychains")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({
    offset,
  }),
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { offset, sortBy, sortDirection, ...filterDefaultValues } = search;

  const { data, isLoading } = useQuery({
    ...keychainsQuery(offset),
    placeholderData: keepPreviousData,
  });

  const hasAppliedFilters = Object.entries(filterDefaultValues).some(
    ([key, value]) =>
      value !==
      keychainSearchDefaultValues[key as keyof typeof filterDefaultValues],
  );

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              hierarchy="brand"
              kind="filled"
              onPress={() => setIsCreateModalOpen(true)}
              size="md"
            >
              Create Keychain
            </Button>
          </>
        }
        title="Keychains"
      />

      <KeychainFilters
        defaultValues={filterDefaultValues}
        onDebouncedChange={handleSearchChange}
      />

      <KeychainTable
        hasAppliedFilters={hasAppliedFilters}
        isLoading={isLoading}
        keychains={data?.items ?? []}
        onSortChange={handleSearchChange}
        sortDescriptor={{ sortBy, sortDirection }}
      />

      <Pagination
        className="mx-auto mt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={(offset) => handleSearchChange({ offset })}
        totalItems={data?.pagination.total ?? 0}
      />

      <CreateKeychainModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
