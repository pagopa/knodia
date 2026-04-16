import type { bffApi } from "@knodia/bff-client";

import { Breadcrumb, Breadcrumbs, Button, Modal } from "@knodia/ui-kit/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { EditEServiceModal } from "@/features/e-service/components/EditEServiceModal";
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

function EditAction({
  eservice,
}: {
  eservice: bffApi.ProducerEserviceDetails;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <Button
        hierarchy="brand"
        kind="filled"
        onClick={() => setIsEditOpen(true)}
        size="md"
      >
        Edit
      </Button>
      <EditEServiceModal
        eservice={eservice}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  );
}

function RouteComponent() {
  const isAdministrative = useHasRole("administrative");
  const isTechnical = useHasRole("technical");
  const { id } = Route.useParams();
  const { data: eservice } = useSuspenseQuery(producerEserviceDetailsQuery(id));

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
            {isAdministrative && <SuspendAction />}
            {(isAdministrative || isTechnical) && (
              <EditAction eservice={eservice} />
            )}
          </>
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

function SuspendAction() {
  return (
    <DialogTrigger>
      <Button hierarchy="danger" isDisabled kind="tonal" size="md">
        Suspend
      </Button>
      <Modal
        actionLabel="Suspend anyway"
        cancelLabel="Cancel"
        description="Suspending an E-Service causes malfunctioning in all the services that use it. Are you sure you want to suspend this E-Service? You will be able to reactivate it later."
        isDismissable
        kind="destructive"
        title="Suspend E-Service"
      />
    </DialogTrigger>
  );
}
