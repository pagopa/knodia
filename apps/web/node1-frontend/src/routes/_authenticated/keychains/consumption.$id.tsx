import {
  getConsumerKeychainDetailsOptions,
  getConsumerKeychainKeysOptions,
  getConsumerKeychainMembersOptions,
  getConsumerKeychainPurposesOptions,
} from "@knodia/bff-client/tanstack-query";
import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Chip,
  Pagination,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@knodia/ui-kit/ui";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useState } from "react";

import type { ConsumerKeychainDetailsTab } from "@/features/keychain/models/commons";

import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { config } from "@/config/config";
import { useHasRole } from "@/contexts/auth";
import { AddKeychainMemberAction } from "@/features/keychain/components/AddKeychainMemberAction";
import { KeychainDeleteAction } from "@/features/keychain/components/KeychainDeleteAction";
import { KeychainEditAction } from "@/features/keychain/components/KeychainEditAction";
import { KeychainMembersTable } from "@/features/keychain/components/KeychainMembersTable";
import { KeychainPublicKeysTable } from "@/features/keychain/components/KeychainPublicKeysTable";
import { LinkedPurposesTable } from "@/features/keychain/components/LinkedPurposesTable";
import { UploadPublicKeyModal } from "@/features/keychain/components/UploadPublicKeyModal";
import { useIsCurrentUserKeychainMember } from "@/features/keychain/hooks/useIsCurrentUserKeychainMember";
import {
  consumerKeychainDetailsSearchDefaultValues,
  consumerKeychainDetailsSearchSchema,
} from "@/features/keychain/models/search-params";
import { client } from "@/libs/axios";

const consumerKeychainQuery = (consumerKeychainId: string) =>
  getConsumerKeychainDetailsOptions({
    client,
    path: { consumerKeychainId },
  });

export const Route = createFileRoute(
  "/_authenticated/keychains/consumption/$id",
)({
  component: RouteComponent,
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(consumerKeychainQuery(id)),
  search: {
    middlewares: [
      stripSearchParams(consumerKeychainDetailsSearchDefaultValues),
    ],
  },
  validateSearch: consumerKeychainDetailsSearchSchema,
});

function MembersTab() {
  const consumerKeychainId = Route.useParams().id;

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery(
    getConsumerKeychainMembersOptions({
      client,
      path: { consumerKeychainId },
      query: { limit: 50, offset: search.offset },
    }),
  );

  return (
    <Section
      actions={
        <AddKeychainMemberAction
          keychainId={consumerKeychainId}
          keychainType="consumption"
        />
      }
      description="Only the Keychain members can upload public keys."
      title="Members"
    >
      <KeychainMembersTable
        isLoading={isLoading}
        keychainId={consumerKeychainId}
        members={data?.results ?? []}
        type="consumption"
      />
      <Pagination
        className="mx-auto mt-6"
        limit={data?.pagination.limit ?? 0}
        offset={search.offset}
        onOffsetChange={(offset) =>
          navigate({ replace: true, search: (s) => ({ ...s, offset }) })
        }
        totalItems={data?.pagination.total ?? 0}
      />
    </Section>
  );
}

function PublicKeysTab() {
  const consumerKeychainId = Route.useParams().id;
  const [isUploadKeyModalOpen, setIsUploadKeyModalOpen] = useState(false);

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery(
    getConsumerKeychainKeysOptions({
      client,
      path: { consumerKeychainId },
      query: { limit: 50, offset: search.offset },
    }),
  );

  const hasReachedMaxKeys = data
    ? data.pagination.total >= config.maxKeysPerKeychain
    : false;

  const isKeychainMember = useIsCurrentUserKeychainMember(consumerKeychainId);
  const canDownloadKey = useHasRole("administrative") || isKeychainMember;

  return (
    <>
      <Section
        actions={
          <>
            <Button
              hierarchy="brand"
              kind="filled"
              onClick={() => setIsUploadKeyModalOpen(true)}
              size="md"
            >
              Upload key
            </Button>
          </>
        }
        title="Public Keys"
      >
        <KeychainPublicKeysTable
          canDownloadKey={canDownloadKey}
          isLoading={isLoading}
          keychainId={consumerKeychainId}
          keys={data?.results ?? []}
          type="consumption"
        />
        <Pagination
          className="mx-auto mt-6"
          limit={data?.pagination.limit ?? 0}
          offset={search.offset}
          onOffsetChange={(offset) =>
            navigate({ replace: true, search: (s) => ({ ...s, offset }) })
          }
          totalItems={data?.pagination.total ?? 0}
        />
      </Section>

      <UploadPublicKeyModal
        hasReachedMaxKeys={hasReachedMaxKeys}
        isKeychainMember={isKeychainMember}
        isOpen={isUploadKeyModalOpen}
        keychainId={consumerKeychainId}
        onClose={() => setIsUploadKeyModalOpen(false)}
        type="consumption"
      />
    </>
  );
}

function PurposesTab() {
  const consumerKeychainId = Route.useParams().id;

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery(
    getConsumerKeychainPurposesOptions({
      client,
      path: { consumerKeychainId },
      query: { limit: 10, offset: search.offset },
    }),
  );

  return (
    <>
      <Section
        description="You can link a Purpose to the Keychain on the Purpose page."
        title="Purposes"
      >
        <LinkedPurposesTable
          isLoading={isLoading}
          keychainId={consumerKeychainId}
          purposes={data?.results ?? []}
        />
        <Pagination
          className="mx-auto mt-6"
          limit={data?.pagination.limit ?? 0}
          offset={search.offset}
          onOffsetChange={(offset) =>
            navigate({ replace: true, search: (s) => ({ ...s, offset }) })
          }
          totalItems={data?.pagination.total ?? 0}
        />
      </Section>
    </>
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: consumerKeychain } = useSuspenseQuery(
    consumerKeychainQuery(id),
  );

  const activeTab = Route.useSearch().tab;
  const navigate = Route.useNavigate();

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb href={{ to: "/keychains" }}>Keychains</Breadcrumb>
        <Breadcrumb>{consumerKeychain.name.en}</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        actions={
          <>
            <KeychainDeleteAction
              keychainId={consumerKeychain.id}
              type="consumption"
            />
            <KeychainEditAction
              keychain={consumerKeychain}
              type="consumption"
            />
          </>
        }
        copyableId={consumerKeychain.id}
        description={consumerKeychain.description?.en}
        title={consumerKeychain.name.en}
      />

      <Chip kind="informative" label="Consumption" type="light" />

      <Tabs
        className="mt-10"
        kind="hug"
        onSelectionChange={(key) =>
          navigate({
            replace: true,
            search: (s) => ({
              ...s,
              offset: 0,
              tab: key as ConsumerKeychainDetailsTab,
            }),
          })
        }
        selectedKey={activeTab}
      >
        <TabList aria-label="Tabs">
          <Tab id="public-keys" key="public-keys">
            Public Keys
          </Tab>
          <Tab id="purposes" key="purposes">
            Purposes
          </Tab>
          <Tab id="members" key="members">
            Members
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="public-keys" key="public-keys">
            <PublicKeysTab />
          </TabPanel>
          <TabPanel id="purposes" key="purposes">
            <PurposesTab />
          </TabPanel>
          <TabPanel id="members" key="members">
            <MembersTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
