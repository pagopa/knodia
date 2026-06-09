import {
  Button,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@knodia/ui-kit/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";
import { match } from "ts-pattern";

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { CreateKeychainModal } from "@/features/keychain/components/CreateKeychainModal";
import { KeychainTable } from "@/features/keychain/components/KeychainTable";
import { keychainType } from "@/features/keychain/models/commons";
import {
  keychainSearchDefaultValues,
  keychainSearchSchema,
} from "@/features/keychain/models/search-params";
import {
  consumerKeychainsQuery,
  knodeApiKeychainsQuery,
  producerKeychainsQuery,
} from "@/features/keychain/services/queries";

export const Route = createFileRoute("/_authenticated/keychains/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset, type } }) => ({
    offset,
    type,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset, type } }) => {
    const query = match(type)
      .with("api", () => knodeApiKeychainsQuery(offset))
      .with("consumption", () => consumerKeychainsQuery(offset))
      .with("production", () => producerKeychainsQuery(offset))
      .exhaustive();
    queryClient.prefetchQuery(query);
  },
  search: {
    middlewares: [stripSearchParams(keychainSearchDefaultValues)],
  },
  validateSearch: keychainSearchSchema,
});

function RouteComponent() {
  const canCreateKeychain = useHasRole("administrative");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { offset, type: selectedTab } = search;

  const { data: consumerData, isLoading: isConsumerLoading } = useQuery({
    ...consumerKeychainsQuery(offset),
    enabled: selectedTab === "consumption",
    placeholderData: keepPreviousData,
  });

  const { data: apiData, isLoading: isApiLoading } = useQuery({
    ...knodeApiKeychainsQuery(offset),
    enabled: selectedTab === "api",
    placeholderData: keepPreviousData,
  });

  const { data: producerData, isLoading: isProducerLoading } = useQuery({
    ...producerKeychainsQuery(offset),
    enabled: selectedTab === "production",
    placeholderData: keepPreviousData,
  });

  const activeData = match(selectedTab)
    .with("api", () => apiData)
    .with("consumption", () => consumerData)
    .with("production", () => producerData)
    .exhaustive();

  function handleSearchChange(values: Partial<typeof search>) {
    navigate({ replace: true, search: (s) => ({ ...s, ...values }) });
  }

  return (
    <ListPageLayout
      pagination={{
        limit: activeData?.pagination.limit ?? 0,
        offset,
        onOffsetChange: (offset) => handleSearchChange({ offset }),
        totalItems: activeData?.pagination.total ?? 0,
      }}
    >
      <PageHeader
        actions={
          canCreateKeychain && (
            <Button
              hierarchy="brand"
              kind="filled"
              onPress={() => setIsCreateModalOpen(true)}
              size="md"
            >
              Create Keychain
            </Button>
          )
        }
        title="Keychains"
      />

      <Tabs
        kind="hug"
        onSelectionChange={(key) => {
          const parsed = keychainType.safeParse(key);
          if (parsed.success) {
            handleSearchChange({ offset: 0, type: parsed.data });
          }
        }}
        selectedKey={selectedTab}
      >
        <TabList aria-label="Tabs">
          <Tab id="consumption" key="consumption">
            Consumption
          </Tab>
          <Tab id="production" key="production">
            Production
          </Tab>
          <Tab id="api" key="api">
            Knode API
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="consumption" key="consumption">
            <KeychainTable
              isLoading={isConsumerLoading}
              keychains={consumerData?.results ?? []}
              type="consumption"
            />
          </TabPanel>
          <TabPanel id="production" key="production">
            <KeychainTable
              isLoading={isProducerLoading}
              keychains={producerData?.results ?? []}
              type="production"
            />
          </TabPanel>
          <TabPanel id="api" key="api">
            <KeychainTable
              isLoading={isApiLoading}
              keychains={apiData?.results ?? []}
              type="api"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <CreateKeychainModal
        defaultType={selectedTab}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </ListPageLayout>
  );
}
