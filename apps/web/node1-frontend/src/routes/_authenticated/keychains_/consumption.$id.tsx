import { getConsumerKeychainDetailsOptions } from "@knodia/bff-client/tanstack-query";
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CopyableValueField } from "@/components/CopyableValueField";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/features/e-service/components/Section";
import { KeychainDeleteAction } from "@/features/keychain/components/KeychainDeleteAction";
import { KeychainEditAction } from "@/features/keychain/components/KeychainEditAction";
import { client } from "@/libs/axios";

const consumerKeychainQuery = (consumerKeychainId: string) =>
  getConsumerKeychainDetailsOptions({
    client,
    path: { consumerKeychainId },
  });

export const Route = createFileRoute(
  "/_authenticated/keychains_/consumption/$id",
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(consumerKeychainQuery(id)),
});

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
        title={consumerKeychain.name.en}
      >
        <CopyableValueField
          className="mt-3"
          label="ID"
          value={consumerKeychain.id}
        />
        {consumerKeychain.description && (
          <p className="mt-6 body-md text-primary-light-low-contrast max-w-160">
            {consumerKeychain.description.en}
          </p>
        )}
      </PageHeader>

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
            <Section
              actions={
                <Button hierarchy="brand" isDisabled kind="filled" size="md">
                  Add member
                </Button>
              }
              description="Only the Keychain members can upload public keys."
              title="Members"
            >
              <Banner icon={<SelectionPlusIcon />} kind="neutral">
                There are no members in this Keychain. Add the first one.
              </Banner>
            </Section>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
