import {
  getConsumerKeychainDetailsOptions,
  getConsumerKeychainKeysOptions,
  getConsumerKeychainMembersOptions,
} from "@knodia/bff-client/tanstack-query";
import {
  Banner,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Chip,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@knodia/ui-kit/ui";
import { SelectionIcon, SelectionPlusIcon } from "@phosphor-icons/react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { AddKeychainMemberAction } from "@/features/keychain/components/AddKeychainMemberAction";
import { KeychainDeleteAction } from "@/features/keychain/components/KeychainDeleteAction";
import { KeychainEditAction } from "@/features/keychain/components/KeychainEditAction";
import { KeychainMembersTable } from "@/features/keychain/components/KeychainMembersTable";
import { KeychainPublicKeysTable } from "@/features/keychain/components/KeychainPublicKeysTable";
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
});

function MembersTab() {
  const consumerKeychainId = Route.useParams().id;

  const { data: members = [], isLoading } = useQuery(
    getConsumerKeychainMembersOptions({
      client,
      path: { consumerKeychainId },
    }),
  );

  return (
    <Section
      actions={
        <AddKeychainMemberAction
          alreadyKeychainMembersIds={members.map((member) => member.id)}
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
        members={members}
        type="consumption"
      />
    </Section>
  );
}

function PublicKeysTab() {
  const consumerKeychainId = Route.useParams().id;

  const { data: keys = [], isLoading } = useQuery(
    getConsumerKeychainKeysOptions({
      client,
      path: { consumerKeychainId },
      query: { limit: 10, offset: 0 },
    }),
  );

  console.log({ keys });

  return (
    <Section actions={<></>} title="Public Keys">
      <KeychainPublicKeysTable
        isLoading={isLoading}
        keychainId={consumerKeychainId}
        keys={keys.results}
        type="consumption"
      />
    </Section>
  );
}

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: consumerKeychain } = useSuspenseQuery(
    consumerKeychainQuery(id),
  );

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

      <Tabs className="mt-10" defaultSelectedKey="public-keys" kind="hug">
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
            <Section
              actions={
                <Button hierarchy="brand" isDisabled kind="filled" size="md">
                  Upload key
                </Button>
              }
              title="Public Keys"
            >
              <Banner icon={<SelectionPlusIcon />} kind="neutral">
                You don't have a public key yet. Upload your first one.
              </Banner>
            </Section>
          </TabPanel>
          <TabPanel id="purposes" key="purposes">
            <Section
              description="You can link a Purpose to the Keychain on the Purpose page."
              title="Purposes"
            >
              <Banner icon={<SelectionIcon />} kind="neutral">
                There are no Purpose linked to this Keychain yet.
              </Banner>
            </Section>
          </TabPanel>
          <TabPanel id="members" key="members">
            <MembersTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
