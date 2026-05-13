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

import { ListPageLayout } from "@/components/ListPageLayout";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { CreateKeychainModal } from "@/features/keychain/components/CreateKeychainModal";
import { KeychainTable } from "@/features/keychain/components/KeychainTable";
import {
  keychainSearchDefaultValues,
  keychainSearchSchema,
} from "@/features/keychain/models/search-params";
import {
  consumerKeychainsQuery,
  knodeApiKeychainsQuery,
} from "@/features/keychain/services/queries";

export const Route = createFileRoute("/_authenticated/keychains/")({
  component: RouteComponent,
  loaderDeps: ({ search: { offset, type } }) => ({
    offset,
    type,
  }),
  // eslint-disable-next-line perfectionist/sort-objects
  loader: ({ context: { queryClient }, deps: { offset, type } }) => {
    if (type === "api") {
      queryClient.prefetchQuery(knodeApiKeychainsQuery(offset));
    } else {
      queryClient.prefetchQuery(consumerKeychainsQuery(offset));
    }
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

  const activeData = selectedTab === "api" ? apiData : consumerData;

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
          if (key === "api" || key === "consumption") {
            handleSearchChange({ offset: 0, type: key });
          }
        }}
        selectedKey={selectedTab}
      >
        <TabList aria-label="Tabs">
          <Tab id="production" isDisabled key="production">
            Production
          </Tab>
          <Tab id="consumption" key="consumption">
            Consumption
          </Tab>
          <Tab id="api" key="api">
            API
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="production" key="production"></TabPanel>
          <TabPanel id="consumption" key="consumption">
            <KeychainTable
              isLoading={isConsumerLoading}
              keychains={consumerData?.results ?? []}
              type="consumption"
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
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </ListPageLayout>
  );
}
