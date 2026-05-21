import type { bffApi } from "@knodia/bff-client";

import { type EserviceId, unsafeBrandId } from "@knodia/common-models/ids";
import { Breadcrumb, Breadcrumbs, Button, Chip } from "@knodia/ui-kit/ui";
import { ArchiveIcon } from "@phosphor-icons/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DialogTrigger } from "react-aria-components";

import { PageHeader } from "@/components/PageHeader";
import { useHasRole } from "@/contexts/auth";
import { producerRecentAgreementsByEserviceQuery } from "@/features/agreement/services/queries";
import { CategoryChip } from "@/features/e-service/components/CategoryChip";
import { EditEServiceModal } from "@/features/e-service/components/EditEServiceModal";
import { EserviceModeChip } from "@/features/e-service/components/EserviceModeChip";
import { EserviceProducerActions } from "@/features/e-service/components/EserviceProducerActions";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";
import { ProductionEServiceDetailsTabs } from "@/features/e-service/components/ProductionEServiceDetailsTabs";
import { producerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { producerRecentPurposesByEserviceQuery } from "@/features/purpose/services/queries";
import { formatNumericDate } from "@/utils/formatters";

export const Route = createFileRoute(
  "/_authenticated/production/e-services/$id",
)({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { id } }) => {
    const eserviceId = unsafeBrandId<EserviceId>(id);
    void queryClient.prefetchQuery(
      producerRecentAgreementsByEserviceQuery(eserviceId),
    );
    void queryClient.prefetchQuery(
      producerRecentPurposesByEserviceQuery(eserviceId),
    );
    return await queryClient.ensureQueryData(producerEserviceDetailsQuery(id));
  },
});

function EditAction({
  eservice,
}: {
  eservice: bffApi.ProducerEserviceDetails;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <DialogTrigger>
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
    </DialogTrigger>
  );
}

function RouteComponent() {
  const isAdministrative = useHasRole("administrative");
  const { id } = Route.useParams();
  const { data: eservice } = useSuspenseQuery(producerEserviceDetailsQuery(id));
  const isArchived = eservice.version.state === "Archived";
  const editAction = <EditAction eservice={eservice} />;

  return (
    <>
      <Breadcrumbs className="mb-10">
        <Breadcrumb isDisabled>Production</Breadcrumb>
        <Breadcrumb href={{ to: "/production/e-services" }}>
          E-Services
        </Breadcrumb>
        {isArchived && (
          <Breadcrumb href={{ to: "/production/e-services/archive" }}>
            Archive
          </Breadcrumb>
        )}
        <Breadcrumb>{eservice.name.en}</Breadcrumb>
      </Breadcrumbs>

      <PageHeader
        actions={
          isArchived ? (
            <Chip
              icon={<ArchiveIcon />}
              kind="neutral"
              label={`Archived ${formatNumericDate(eservice.version.updatedAt)}`}
              type="light"
            />
          ) : isAdministrative ? (
            <EserviceProducerActions
              editAction={editAction}
              eserviceId={eservice.id}
              state={eservice.version.state}
            />
          ) : (
            editAction
          )
        }
        copyableId={eservice.id}
        description={eservice.description.en}
        resourceStatusChip={
          isArchived ? undefined : (
            <EserviceStateChip state={eservice.version.state} />
          )
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
          />
        ))}
      </div>

      <ProductionEServiceDetailsTabs eservice={eservice} />
    </>
  );
}
