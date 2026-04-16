import type { bffApi } from "@knodia/bff-client";

import { type AgreementId, unsafeBrandId } from "@knodia/common-models/ids";
import { Button, Modal } from "@knodia/ui-kit/ui";
import { DialogTrigger } from "react-aria-components";
import { match } from "ts-pattern";

import { OrganizationCard } from "@/components/OrganizationCard";
import { PageHeader } from "@/components/PageHeader";
import { RouterLink } from "@/components/routerLinks";
import { SettingsCard } from "@/components/SettingCard";
import { useHasRole } from "@/contexts/auth";
import { EserviceStateChip } from "@/features/e-service/components/EserviceStateChip";

import { useReactivateProducerAgreement } from "../../hooks/useReactivateProducerAgreement";
import { useSuspendProducerAgreement } from "../../hooks/useSuspendProducerAgreement";
import { AgreementStateChip } from "../AgreementStateChip";
import { AgreementPurposeSection } from "./AgreementPurposeSection";

export function ProducerAgreementDetail({
  agreement,
}: {
  agreement: bffApi.ProducerAgreementDetails;
}) {
  const canManageAgreementState = useHasRole("administrative");

  return (
    <>
      <PageHeader
        actions={
          canManageAgreementState && (
            <AgreementActionButton agreement={agreement} />
          )
        }
        resourceStatusChip={
          <AgreementStateChip
            state={agreement.state}
            suspendedByConsumerAt={agreement.suspendedByConsumerAt}
            suspendedByProducerAt={agreement.suspendedByProducerAt}
            type="light"
          />
        }
        title="Agreement request"
      />

      <div className="flex flex-col gap-4">
        <SettingsCard label="E-Service">
          <span className="flex items-center gap-6">
            <RouterLink
              params={{ id: agreement.eservice.id }}
              to="/production/e-services/$id"
              variant="inline"
            >
              {agreement.eservice.name.en}
            </RouterLink>
            <EserviceStateChip state={agreement.latestEserviceVersionState} />
          </span>
        </SettingsCard>

        <div className="grid grid-cols-2 gap-4">
          <OrganizationCard
            label="Producer"
            organization={agreement.producer}
            showContact={false}
          />
          <OrganizationCard
            label="Consumer"
            organization={agreement.consumer}
            showContact={true}
          />
        </div>
      </div>

      <AgreementPurposeSection
        agreementId={unsafeBrandId<AgreementId>(agreement.id)}
      />
    </>
  );
}

function AgreementActionButton({
  agreement,
}: {
  agreement: bffApi.ProducerAgreementDetails;
}) {
  return match(agreement.state)
    .with("Active", () => (
      <SuspendProducerAgreementButton
        agreementId={unsafeBrandId<AgreementId>(agreement.id)}
      />
    ))
    .with("Suspended", () =>
      agreement.suspendedByProducerAt !== null ? (
        <ReactivateProducerAgreementButton
          agreementId={unsafeBrandId<AgreementId>(agreement.id)}
        />
      ) : null,
    )
    .with("Archived", "PendingConsumerOperatorIdentification", () => null)
    .exhaustive();
}

function ReactivateProducerAgreementButton({
  agreementId,
}: {
  agreementId: AgreementId;
}) {
  const { isError, isPending, reactivateAgreement } =
    useReactivateProducerAgreement(agreementId);

  return (
    <DialogTrigger>
      <Button hierarchy="brand" kind="filled" size="md">
        Reactivate
      </Button>
      <Modal
        actionLabel="Reactivate"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending }}
        description="Are you sure you want to reactivate this Agreement? The Consumer will be able to use the associated E-Service again."
        isDismissable
        onConfirm={reactivateAgreement}
        showErrorBanner={isError}
        title="Reactivate Agreement"
      />
    </DialogTrigger>
  );
}

function SuspendProducerAgreementButton({
  agreementId,
}: {
  agreementId: AgreementId;
}) {
  const { isError, isPending, suspendAgreement } =
    useSuspendProducerAgreement(agreementId);

  return (
    <DialogTrigger>
      <Button hierarchy="danger" kind="tonal" size="md">
        Suspend
      </Button>
      <Modal
        actionLabel="Suspend anyway"
        cancelLabel="Cancel"
        confirmButtonProps={{ isPending }}
        isDismissable
        kind="destructive"
        onConfirm={suspendAgreement}
        showErrorBanner={isError}
        title="Suspend Agreement"
      >
        <p className="body-md">
          If you suspend it, the Consumer won&apos;t be able to use the
          associated E-Service or reactivate the Agreement. Are you sure you
          want to suspend this Agreement?
        </p>
        <p className="body-md">You will be able to reactivate it later.</p>
      </Modal>
    </DialogTrigger>
  );
}
