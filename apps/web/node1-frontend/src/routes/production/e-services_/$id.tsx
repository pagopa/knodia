import { getEservicesOptions } from "@knodia/bff-client/tanstack-query";
import { Breadcrumb, Breadcrumbs, Button, Chip } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { CopyableInfoField } from "@/components/CopyableInfoField";
import { PageHeader } from "@/components/PageHeader";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { ProductionEServiceDetailsTabs } from "@/features/e-service/components/ProductionEServiceDetailsTabs";
import { client } from "@/libs/axios";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eserviceQuery = (_id: string) =>
  getEservicesOptions({
    client,
    query: { limit: 1, offset: 0 },
  });

export const Route = createFileRoute("/production/e-services_/$id")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (await queryClient.ensureQueryData(eserviceQuery(id))).items[0]!,
});

function RouteComponent() {
  const eservice = Route.useLoaderData();

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/e-services" }}>
          E-Services
        </Breadcrumb>
        <Breadcrumb>{eservice.name.en}</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        actions={
          <>
            <Button hierarchy="danger" kind="tonal" size="md">
              Suspend
            </Button>
            <Button hierarchy="brand" kind="filled" size="md">
              Edit
            </Button>
          </>
        }
        resourceStatusChip={<EserviceStateChip state="Active" />}
        title={eservice.name.en}
      >
        <CopyableInfoField className="mt-3" id={eservice.id} label="ID" />
        <p className="mt-6 body-md text-primary-light-low-contrast max-w-160">
          {eservice.description.en}
        </p>
      </PageHeader>

      <div className="mt-10 flex gap-2">
        <EserviceModeChip mode={eservice.mode} />
        {eservice.categories.map((category) => (
          <Chip
            key={category.code}
            kind="neutral"
            label={category.code}
            type="light"
          />
        ))}
      </div>

      <ProductionEServiceDetailsTabs eservice={eservice} />
    </>
  );
}
