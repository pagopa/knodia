import type { bffApi } from "@knodia/bff-client";

import {
  type AgreementId,
  type EserviceId,
  type KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { Banner } from "@knodia/ui-kit/ui";
import {
  ArchiveIcon,
  CaretDownIcon,
  CaretUpIcon,
  SelectionIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useContext, useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  DisclosureStateContext,
  Heading,
} from "react-aria-components";
import { match } from "ts-pattern";

import { RecentlyUpdatedChip } from "@/components/RecentlyUpdatedChip";
import { useHasRole } from "@/contexts/auth";
import { ArchiveAgreementModal } from "@/features/agreement/components/ArchiveAgreementModal";
import {
  ConsumerSuspendAgreementBody,
  SuspendAgreementModal,
} from "@/features/agreement/components/SuspendAgreementModal";
import { useArchiveConsumerAgreement } from "@/features/agreement/hooks/useArchiveConsumerAgreement";
import { useReactivateConsumerAgreement } from "@/features/agreement/hooks/useReactivateConsumerAgreement";
import { useSuspendConsumerAgreement } from "@/features/agreement/hooks/useSuspendConsumerAgreement";

import { EservicePurposeSection } from "./EservicePurposeSection";

export function OrgConsumptionStatusSection({
  agreement,
  eserviceId,
  eserviceState,
  hasRecentlyBeenUpdated,
  knodeId,
}: {
  agreement: bffApi.EserviceAgreementDetail;
  eserviceId: EserviceId;
  eserviceState: bffApi.EserviceVersionState;
  hasRecentlyBeenUpdated: boolean;
  knodeId: KnodeId;
}) {
  const canManageConsumption = useHasRole("administrative");

  return (
    <Disclosure
      className="flex flex-col rounded-lg border border-primary-light-decorative px-6 pt-6 data-expanded:pb-6 elevation-2"
      defaultExpanded
    >
      <CollapseTrigger hasRecentlyBeenUpdated={hasRecentlyBeenUpdated} />

      <DisclosurePanel className="mt-6 flex flex-col gap-6">
        <AgreementStatusBanner
          agreement={agreement}
          canManageAgreement={canManageConsumption}
          eserviceId={eserviceId}
          knodeId={knodeId}
        />

        {match(agreement.state)
          .with("Active", "Suspended", "Archived", () => (
            <>
              <EservicePurposeSection
                agreementState={agreement.state}
                eserviceId={eserviceId}
                eserviceState={eserviceState}
                knodeId={knodeId}
              />

              <div className="mt-4 flex flex-col gap-4">
                <h3 className="title-md-em text-primary-light-low-contrast">
                  Keychains
                </h3>
                <Banner icon={<SelectionIcon />} kind="neutral">
                  To request an access token for this E-Service, associate a
                  Keychain to a Purpose from the Purpose page. Associated
                  Keychains will appear here.
                </Banner>
              </div>
            </>
          ))
          .otherwise(() => null)}
      </DisclosurePanel>
    </Disclosure>
  );
}

function AgreementStatusBanner({
  agreement,
  canManageAgreement,
  eserviceId,
  knodeId,
}: {
  agreement: bffApi.EserviceAgreementDetail;
  canManageAgreement: boolean;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const agreementId = unsafeBrandId<AgreementId>(agreement.id);

  const banner = match(agreement.state)
    .with("Active", () =>
      canManageAgreement ? (
        <SuspendConsumerAgreementButton
          agreementId={agreementId}
          eserviceId={eserviceId}
          knodeId={knodeId}
        />
      ) : (
        <Banner kind="success">Active</Banner>
      ),
    )
    .with("Suspended", () => (
      <SuspendedAgreementBanner
        agreement={agreement}
        canManageAgreement={canManageAgreement}
        eserviceId={eserviceId}
        knodeId={knodeId}
      />
    ))
    .with("Archived", () => (
      <Banner icon={<ArchiveIcon />} kind="neutral" size="md" title="Archived">
        <span className="block max-w-160">
          You can&apos;t restore an archived Agreement. If your organization has
          the required attributes, you can request a new one.
        </span>
      </Banner>
    ))
    .with("PendingConsumerOperatorIdentification", () => (
      <Banner
        icon={<WarningCircleIcon />}
        kind="informative"
        size="md"
        title="Action needed"
      >
        To activate the Agreement, you must log in to the Producer Knode.
      </Banner>
    ))
    .exhaustive();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="title-md-em text-primary-light-low-contrast">Agreement</h3>
      {banner}
    </div>
  );
}

function CollapseTrigger({
  hasRecentlyBeenUpdated,
}: {
  hasRecentlyBeenUpdated: boolean;
}) {
  const state = useContext(DisclosureStateContext);
  const isExpanded = state?.isExpanded ?? false;

  return (
    <Heading level={2}>
      <Button
        className="flex w-full cursor-pointer items-center justify-between"
        slot="trigger"
      >
        <span className="title-lg-em text-primary-light-high-contrast">
          Your Org&apos;s consumption status
        </span>
        <span className="flex items-center gap-4">
          {hasRecentlyBeenUpdated && <RecentlyUpdatedChip />}
          <span
            aria-hidden
            className="flex items-center justify-center rounded-[7px] bg-slate-100 p-2"
          >
            {isExpanded ? (
              <CaretUpIcon size={20} />
            ) : (
              <CaretDownIcon size={20} />
            )}
          </span>
        </span>
      </Button>
    </Heading>
  );
}

function SuspendConsumerAgreementButton({
  agreementId,
  eserviceId,
  knodeId,
}: {
  agreementId: AgreementId;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { isError, isPending, suspendAgreement } = useSuspendConsumerAgreement({
    agreementId,
    eserviceId,
    knodeId,
  });

  return (
    <>
      <Banner
        action={{ label: "Suspend", onPress: () => setIsOpen(true) }}
        kind="success"
      >
        Active
      </Banner>
      <SuspendAgreementModal
        isError={isError}
        isOpen={isOpen}
        isPending={isPending}
        onConfirm={suspendAgreement}
        onOpenChange={setIsOpen}
      >
        <ConsumerSuspendAgreementBody />
      </SuspendAgreementModal>
    </>
  );
}

function SuspendedAgreementBanner({
  agreement,
  canManageAgreement,
  eserviceId,
  knodeId,
}: {
  agreement: bffApi.EserviceAgreementDetail;
  canManageAgreement: boolean;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}) {
  const agreementId = unsafeBrandId<AgreementId>(agreement.id);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const {
    archiveAgreement,
    isError: isArchiveError,
    isPending: isArchivePending,
  } = useArchiveConsumerAgreement({ agreementId, eserviceId, knodeId });

  const { isPending: isReactivatePending, reactivateAgreement } =
    useReactivateConsumerAgreement({ agreementId, eserviceId, knodeId });

  const archiveAction = canManageAgreement
    ? { label: "Archive", onPress: () => setIsArchiveModalOpen(true) }
    : undefined;

  return (
    <>
      {agreement.suspendedByProducerAt !== null ? (
        <Banner
          action={archiveAction}
          kind="error"
          size="md"
          title="Suspended by Producer"
        >
          You can&apos;t reactivate this Agreement because it was suspended by
          the Producer. If you believe this is a mistake, contact the Producer
          to request the reactivation, or archive it and request a new
          Agreement.
        </Banner>
      ) : (
        <Banner
          action={archiveAction}
          kind="error"
          prominentAction={
            canManageAgreement && agreement.suspendedByConsumerAt !== null
              ? {
                  isDisabled: isReactivatePending,
                  label: "Reactivate",
                  onPress: reactivateAgreement,
                }
              : undefined
          }
        >
          Suspended
        </Banner>
      )}
      <ArchiveAgreementModal
        isError={isArchiveError}
        isOpen={isArchiveModalOpen}
        isPending={isArchivePending}
        onConfirm={archiveAgreement}
        onOpenChange={setIsArchiveModalOpen}
      />
    </>
  );
}
