import type { bffApi } from "@knodia/bff-client";
import type { ConsumerKeychainId } from "@knodia/common-models/ids";

import {
  getConsumerKeychainKeysOptions,
  getConsumerKeychainMembersOptions,
  getConsumerKeychainPurposesOptions,
  getKnodeApiKeychainKeysOptions,
  getKnodeApiKeychainMembersOptions,
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

import type { SupportedKeychain } from "../models/commons";

type KeychainDetailPageProps<TTab extends string> = SupportedKeychain & {
  activeTab: TTab;
  keychain: bffApi.KeychainDetails;
  offset: number;
  onOffsetChange: (offset: number) => void;
  onTabChange: (tab: TTab) => void;
};

type KeychainTabProps = SupportedKeychain & {
  offset: number;
  onOffsetChange: (offset: number) => void;
};

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
            <KeychainDeleteAction {...props} />
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
            <PublicKeysTab {...props} />
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
            <MembersTab {...props} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}

function ConsumerPurposesTab({
  keychainId,
  offset,
  onOffsetChange,
}: {
  keychainId: ConsumerKeychainId;
  offset: number;
  onOffsetChange: (offset: number) => void;
}) {
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

function MembersTab(props: KeychainTabProps) {
  const { offset, onOffsetChange } = props;

  const options = match(props)
    .with({ type: "consumption" }, ({ keychainId }) =>
      getConsumerKeychainMembersOptions({
        client,
        path: { consumerKeychainId: keychainId },
        query: { limit: 50, offset },
      }),
    )
    .with({ type: "api" }, ({ keychainId }) =>
      getKnodeApiKeychainMembersOptions({
        client,
        path: { knodeApiKeychainId: keychainId },
        query: { limit: 50, offset },
      }),
    )
    .exhaustive();

  const { data, isLoading } = useQuery(options);

  return (
    <Section
      actions={<AddKeychainMemberAction {...props} />}
      description="Only the Keychain members can upload public keys."
      title="Members"
    >
      <KeychainMembersTable
        isLoading={isLoading}
        keychain={props}
        members={data?.results ?? []}
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

function PublicKeysTab(props: KeychainTabProps) {
  const { offset, onOffsetChange } = props;
  const [isUploadKeyModalOpen, setIsUploadKeyModalOpen] = useState(false);

  const options = match(props)
    .with({ type: "consumption" }, ({ keychainId }) =>
      getConsumerKeychainKeysOptions({
        client,
        path: { consumerKeychainId: keychainId },
        query: { limit: 50, offset },
      }),
    )
    .with({ type: "api" }, ({ keychainId }) =>
      getKnodeApiKeychainKeysOptions({
        client,
        path: { knodeApiKeychainId: keychainId },
        query: { limit: 50, offset },
      }),
    )
    .exhaustive();

  const { data, isLoading } = useQuery(options);

  const hasReachedMaxKeys = data
    ? data.pagination.total >= config.maxKeysPerKeychain
    : false;

  const isKeychainMember = useIsCurrentUserKeychainMember(props);
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
          keychain={props}
          keys={data?.results ?? []}
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
        keychain={props}
        onClose={() => setIsUploadKeyModalOpen(false)}
      />
    </>
  );
}
