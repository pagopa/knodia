import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Chip,
  Modal,
} from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";
import { DialogTrigger } from "react-aria-components";

import { CopyableValueField } from "@/components/CopyableValueField";
import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
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

function EServiceActions() {
  return (
    <>
      <DialogTrigger>
        <Button hierarchy="danger" kind="tonal" size="md">
          Suspend
        </Button>
        <Modal
          actionLabel="Suspend anyway"
          description="Suspending an E-Service causes malfunctioning in all the services that use it. Are you sure you want to suspend this E-Service? You will be able to reactivate it later."
          isDismissable
          kind="destructive"
          title="Suspend E-Service"
        />
      </DialogTrigger>
      <DialogTrigger>
        <Button hierarchy="brand" kind="filled" size="md">
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
        actions={canManageEserviceState && <EServiceActions />}
        resourceStatusChip={
          <EserviceStateChip state={eservice.version.state} />
        }
        title={eservice.name.en}
      >
        <CopyableValueField className="mt-3" label="ID" value={eservice.id} />
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
