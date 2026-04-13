import { Breadcrumb, Breadcrumbs, Button, Modal } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";

import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceProducerActions } from "@/features/e-service/components/EserviceProducerActions";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { ProductionEServiceDetailsTabs } from "@/features/e-service/components/ProductionEServiceDetailsTabs";
import { producerEserviceDetailsQuery } from "@/features/e-service/services/queries";

export const Route = createFileRoute(
  "/_authenticated/production/e-services/$id",
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) =>
    await queryClient.ensureQueryData(producerEserviceDetailsQuery(id)),
});

function EServiceActions({
  eserviceId,
  state,
}: {
  eserviceId: string;
  state: Parameters<typeof EserviceProducerActions>[0]["state"];
}) {
  return (
    <>
      <EserviceProducerActions eserviceId={eserviceId} state={state} />
      <DialogTrigger>
        <Button hierarchy="brand" isDisabled kind="filled" size="md">
          Edit
        </Button>
        <Modal actionLabel="Confirm" kind="default" title="Edit E-Service">
          TODO
        </Modal>
      </DialogTrigger>
    </>
  );
}

function RouteComponent() {
  const canManageEserviceState = useHasRole("administrative");
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
          canManageEserviceState && (
            <EServiceActions
              eserviceId={eservice.id}
              state={eservice.version.state}
            />
          )
        }
        copyableId={eservice.id}
        description={eservice.description.en}
        resourceStatusChip={
          <EserviceStateChip state={eservice.version.state} />
        }
        title={eservice.name.en}
      />

      <div className="mt-10 flex gap-2">
        <EserviceModeChip mode={eservice.mode} />
        {eservice.categories.map((category) => (
          <CategoryChip
            code={category.code}
            key={category.code}
            scheme={category.scheme}
            showIcon={false}
          />
        ))}
      </div>

      <ProductionEServiceDetailsTabs eservice={eservice} />
    </>
  );
}
