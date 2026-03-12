import type { bffApi } from "@knodia/bff-client";

import {
  createConsumerKeychainMutation,
  getConsumerKeychainsOptions,
} from "@knodia/bff-client/tanstack-query";
import {
  Button,
  Pagination,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@knodia/ui-kit/ui";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";
import { match } from "ts-pattern";

import type { CreateKeychainFormValues } from "@/features/keychain/models/create-keychain-form";

import { PageHeader } from "@/components/PageHeader";
import { CreateKeychainModal } from "@/features/keychain/components/CreateKeychainModal";
import { KeychainTable } from "@/features/keychain/components/KeychainTable";
import {
  keychainSearchDefaultValues,
  keychainSearchSchema,
} from "@/features/keychain/models/search-params";
import { client } from "@/libs/axios";

const consumerKeychainsQuery = (offset: number) =>
  getConsumerKeychainsOptions({
    client,
    query: { limit: 10, offset },
  });

export const Route = createFileRoute("/_authenticated/keychains")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset } }) => ({
    offset,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset } }) => {
    queryClient.prefetchQuery(consumerKeychainsQuery(offset));
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

  const { offset } = search;

  const { data, isLoading } = useQuery({
    ...consumerKeychainsQuery(offset),
    placeholderData: keepPreviousData,
  });

  const { mutate: createConsumerKeychain } = useMutation({
    ...createConsumerKeychainMutation({
      client,
    }),
    onSuccess: ({ id }) => {
      navigate({ params: { id }, to: "/keychains/consumption/$id" });
    },
  });

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  function handleCreateKeychain(seed: CreateKeychainFormValues) {
    const body: bffApi.ConsumerKeychainSeed = {
      description: seed.description ? { en: seed.description } : undefined,
      name: { en: seed.name },
    };

    match(seed.type)
      .with("consumer", () => createConsumerKeychain({ body }))
      .with("producer", () => {
        throw new Error("Producer keychains are not supported yet.");
      })
      .with("api", () => {
        throw new Error("API keychains are not supported yet.");
      })
      .exhaustive();
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

      <Tabs
        defaultSelectedKey="consumption"
        kind="hug"
        onSelectionChange={() => handleSearchChange({ offset: 0 })}
      >
        <TabList aria-label="Tabs">
          <Tab id="production" isDisabled key="production">
            Production
          </Tab>
          <Tab id="consumption" key="consumption">
            Consumption
          </Tab>
          <Tab id="api" isDisabled key="api">
            API
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="production" key="production"></TabPanel>
          <TabPanel id="consumption" key="consumption">
            <KeychainTable
              isLoading={isLoading}
              keychains={data?.items ?? []}
              type="consumer"
            />
          </TabPanel>
          <TabPanel id="api" key="api"></TabPanel>
        </TabPanels>
      </Tabs>

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
        onCreate={handleCreateKeychain}
      />
    </>
  );
}
