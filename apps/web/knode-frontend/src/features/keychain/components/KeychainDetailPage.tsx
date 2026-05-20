import type { bffApi } from "@knodia/bff-client";
import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import {
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
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";

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
import { client } from "@/libs/axios";

interface ConsumerTabProps {
  keychainId: ConsumerKeychainId;
  offset: number;
  onOffsetChange: (offset: number) => void;
}

type KeychainDetailPageProps<TTab extends string> = {
  activeTab: TTab;
  keychain: bffApi.KeychainDetails;
  offset: number;
  onOffsetChange: (offset: number) => void;
  onTabChange: (tab: TTab) => void;
} & (
  | { keychainId: ConsumerKeychainId; type: "consumption" }
  | { keychainId: KnodeApiKeychainId; type: "api" }
);

export function KeychainDetailPage<TTab extends string>(
  props: KeychainDetailPageProps<TTab>,
) {
  const { activeTab, keychain, offset, onOffsetChange, onTabChange } = props;

  const chipLabel = match(props.type)
    .with("consumption", () => "Consumption")
    .with("api", () => "API")
    .exhaustive();

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb
          href={{ search: { offset: 0, type: props.type }, to: "/keychains" }}
        >
          Keychains
        </Breadcrumb>
        <Breadcrumb>{keychain.name.en}</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        actions={
          <>
            <KeychainDeleteAction
              keychainId={props.keychainId}
              type={props.type}
            />
            <KeychainEditAction keychain={keychain} type={props.type} />
          </>
        }
        copyableId={keychain.id}
        description={keychain.description?.en}
        title={keychain.name.en}
      />

      <Chip kind="informative" label={chipLabel} type="light" />

      <Tabs
        className="mt-10"
        kind="hug"
        onSelectionChange={(key) => onTabChange(key as TTab)}
        selectedKey={activeTab}
      >
        <TabList aria-label="Tabs">
          <Tab id="public-keys" key="public-keys">
            Public Keys
          </Tab>
          {match(props.type)
            .with("consumption", () => (
              <Tab id="purposes" key="purposes">
                Purposes
              </Tab>
            ))
            .with("api", () => null)
            .exhaustive()}
          <Tab id="members" key="members">
            Members
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel id="public-keys" key="public-keys">
            {match(props)
              .with({ type: "consumption" }, ({ keychainId }) => (
                <ConsumerPublicKeysTab
                  keychainId={keychainId}
                  offset={offset}
                  onOffsetChange={onOffsetChange}
                />
              ))
              .with({ type: "api" }, ({ keychainId }) => (
                <ApiPublicKeysTab keychainId={keychainId} />
              ))
              .exhaustive()}
          </TabPanel>
          {match(props)
            .with({ type: "consumption" }, ({ keychainId }) => (
              <TabPanel id="purposes" key="purposes">
                <ConsumerPurposesTab
                  keychainId={keychainId}
                  offset={offset}
                  onOffsetChange={onOffsetChange}
                />
              </TabPanel>
            ))
            .with({ type: "api" }, () => null)
            .exhaustive()}
          <TabPanel id="members" key="members">
            {match(props)
              .with({ type: "consumption" }, ({ keychainId }) => (
                <ConsumerMembersTab
                  keychainId={keychainId}
                  offset={offset}
                  onOffsetChange={onOffsetChange}
                />
              ))
              .with({ type: "api" }, ({ keychainId }) => (
                <ApiMembersTab keychainId={keychainId} />
              ))
              .exhaustive()}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}

// Placeholder until KN-619 wires the GET/add/remove members endpoints
// for API keychains. The table renders its native empty banner in the meantime.
function ApiMembersTab({ keychainId }: { keychainId: KnodeApiKeychainId }) {
  return (
    <Section title="Members">
      <KeychainMembersTable
        isLoading={false}
        keychainId={keychainId}
        members={[]}
        type="api"
      />
    </Section>
  );
}

// Placeholder until KN-619 wires the GET/upload/download/delete keys endpoints
// for API keychains. The table renders its native empty banner in the meantime.
function ApiPublicKeysTab({ keychainId }: { keychainId: KnodeApiKeychainId }) {
  return (
    <Section title="Public Keys">
      <KeychainPublicKeysTable
        canDownloadKey={false}
        isLoading={false}
        keychainId={keychainId}
        keys={[]}
        type="api"
      />
    </Section>
  );
}

function ConsumerMembersTab({
  keychainId,
  offset,
  onOffsetChange,
}: ConsumerTabProps) {
  const { data, isLoading } = useQuery(
    getConsumerKeychainMembersOptions({
      client,
      path: { consumerKeychainId: keychainId },
      query: { limit: 50, offset },
    }),
  );

  return (
    <Section
      actions={
        <AddKeychainMemberAction
          keychainId={keychainId}
          keychainType="consumption"
        />
      }
      description="Only the Keychain members can upload public keys."
      title="Members"
    >
      <KeychainMembersTable
        isLoading={isLoading}
        keychainId={keychainId}
        members={data?.results ?? []}
        type="consumption"
      />
      <Pagination
        className="mx-auto mt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={onOffsetChange}
        totalItems={data?.pagination.total ?? 0}
      />
    </Section>
  );
}

function ConsumerPublicKeysTab({
  keychainId,
  offset,
  onOffsetChange,
}: ConsumerTabProps) {
  const [isUploadKeyModalOpen, setIsUploadKeyModalOpen] = useState(false);

  const { data, isLoading } = useQuery(
    getConsumerKeychainKeysOptions({
      client,
      path: { consumerKeychainId: keychainId },
      query: { limit: 50, offset },
    }),
  );

  const hasReachedMaxKeys = data
    ? data.pagination.total >= config.maxKeysPerKeychain
    : false;

  const isKeychainMember = useIsCurrentUserKeychainMember(keychainId);
  const canDownloadKey = useHasRole("administrative") || isKeychainMember;

  return (
    <>
      <Section
        actions={
          <Button
            hierarchy="brand"
            kind="filled"
            onClick={() => setIsUploadKeyModalOpen(true)}
            size="md"
          >
            Upload key
          </Button>
        }
        title="Public Keys"
      >
        <KeychainPublicKeysTable
          canDownloadKey={canDownloadKey}
          isLoading={isLoading}
          keychainId={keychainId}
          keys={data?.results ?? []}
          type="consumption"
        />
        <Pagination
          className="mx-auto mt-6"
          limit={data?.pagination.limit ?? 0}
          offset={offset}
          onOffsetChange={onOffsetChange}
          totalItems={data?.pagination.total ?? 0}
        />
      </Section>

      <UploadPublicKeyModal
        hasReachedMaxKeys={hasReachedMaxKeys}
        isKeychainMember={isKeychainMember}
        isOpen={isUploadKeyModalOpen}
        keychainId={keychainId}
        onClose={() => setIsUploadKeyModalOpen(false)}
        type="consumption"
      />
    </>
  );
}

function ConsumerPurposesTab({
  keychainId,
  offset,
  onOffsetChange,
}: ConsumerTabProps) {
  const { data, isLoading } = useQuery(
    getConsumerKeychainPurposesOptions({
      client,
      path: { consumerKeychainId: keychainId },
      query: { limit: 10, offset },
    }),
  );

  return (
    <Section
      description="You can link a Purpose to the Keychain on the Purpose page."
      title="Purposes"
    >
      <LinkedPurposesTable
        isLoading={isLoading}
        purposes={data?.results ?? []}
      />
      <Pagination
        className="mx-auto mt-6"
        limit={data?.pagination.limit ?? 0}
        offset={offset}
        onOffsetChange={onOffsetChange}
        totalItems={data?.pagination.total ?? 0}
      />
    </Section>
  );
}
