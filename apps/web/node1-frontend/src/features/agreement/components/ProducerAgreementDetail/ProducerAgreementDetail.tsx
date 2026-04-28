import type { bffApi } from "@knodia/bff-client";

import { type AgreementId, unsafeBrandId } from "@knodia/common-models/ids";
import { Banner, Button } from "@knodia/ui-kit/ui";
import { useState } from "react";
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
import {
  ProducerSuspendAgreementBody,
  SuspendAgreementModal,
} from "../SuspendAgreementModal";
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
          <AgreementStateChip state={agreement.state} type="light" />
        }
        title="Agreement request"
      />

      {canManageAgreementState &&
        agreement.state === "Suspended" &&
        agreement.suspendedByConsumerAt !== null &&
        agreement.suspendedByProducerAt === null && (
          <ConsumerSuspendedBanner
            agreementId={unsafeBrandId<AgreementId>(agreement.id)}
          />
        )}

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

function ConsumerSuspendedBanner({
  agreementId,
}: {
  agreementId: AgreementId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendAgreement } =
    useSuspendProducerAgreement(agreementId);

  return (
    <>
      <Banner
        action={{
          label: "Suspend to prevent reactivation",
          onPress: () => setIsOpen(true),
        }}
        kind="warning"
        size="md"
        title="The Consumer suspended this Agreement"
      >
        You can also suspend the Agreement on your side to prevent the Consumer
        from reactivating it.
      </Banner>
      <SuspendAgreementModal
        isError={isError}
        isOpen={isOpen}
        isPending={isPending}
        onConfirm={suspendAgreement}
        onOpenChange={setIsOpen}
      >
        <ProducerSuspendAgreementBody />
      </SuspendAgreementModal>
    </>
  );
}

function ReactivateProducerAgreementButton({
  agreementId,
}: {
  agreementId: AgreementId;
}) {
  const { isPending, reactivateAgreement } =
    useReactivateProducerAgreement(agreementId);

  return (
    <Button
      hierarchy="brand"
      isPending={isPending}
      kind="filled"
      onPress={reactivateAgreement}
      size="md"
    >
      Reactivate
    </Button>
  );
}

function SuspendProducerAgreementButton({
  agreementId,
}: {
  agreementId: AgreementId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendAgreement } =
    useSuspendProducerAgreement(agreementId);

  return (
    <>
      <Button
        hierarchy="danger"
        kind="tonal"
        onPress={() => setIsOpen(true)}
        size="md"
      >
        Suspend
      </Button>
      <SuspendAgreementModal
        isError={isError}
        isOpen={isOpen}
        isPending={isPending}
        onConfirm={suspendAgreement}
        onOpenChange={setIsOpen}
      >
        <ProducerSuspendAgreementBody />
      </SuspendAgreementModal>
    </>
  );
}
