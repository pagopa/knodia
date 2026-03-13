import { getConsumerKeychainDetailsOptions } from "@knodia/bff-client/tanstack-query";
import { Breadcrumb, Breadcrumbs, Chip } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { CopyableValueField } from "@/components/CopyableValueField";
import { PageHeader } from "@/components/PageHeader";
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
    await queryClient.ensureQueryData(consumerKeychainQuery(id)),
});

function RouteComponent() {
  const consumerKeychain = Route.useLoaderData();

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
    </>
  );
}
