import type { bffApi } from "@knodia/bff-client";
import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { Banner, Modal } from "@knodia/ui-kit/ui";
import {
  CaretDownIcon,
  CaretUpIcon,
  SelectionIcon,
} from "@phosphor-icons/react";
import { useContext, useState } from "react";
import {
  Button,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  DisclosureStateContext,
  Heading,
} from "react-aria-components";
import { match } from "ts-pattern";

import { RecentlyUpdatedChip } from "@/components/RecentlyUpdatedChip";
import { useHasRole } from "@/contexts/auth";
import { useReactivateConsumerAgreement } from "@/features/agreement/hooks/useReactivateConsumerAgreement";
import { useSuspendConsumerAgreement } from "@/features/agreement/hooks/useSuspendConsumerAgreement";

import { EservicePurposeSection } from "./EservicePurposeSection";

export function OrgConsumptionStatusSection({
  agreement,
  eserviceId,
  hasRecentlyBeenUpdated,
  knodeId,
}: {
  agreement: bffApi.EserviceAgreementDetail;
  eserviceId: EserviceId;
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

        <EservicePurposeSection eserviceId={eserviceId} knodeId={knodeId} />

        <div className="mt-4 flex flex-col gap-4">
          <h3 className="title-md-em text-primary-light-low-contrast">
            Keychains
          </h3>
          <Banner icon={<SelectionIcon />} kind="neutral">
            To request an access token for this E-Service, associate a Keychain
            to a Purpose from the Purpose page. Associated Keychain will appear
            here.
          </Banner>
        </div>
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
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const {
    isError: isSuspendError,
    isPending: isSuspendPending,
    suspendAgreement,
  } = useSuspendConsumerAgreement({
    agreementId: agreement.id,
    eserviceId,
    knodeId,
  });

  const { isPending: isReactivatePending, reactivateAgreement } =
    useReactivateConsumerAgreement({
      agreementId: agreement.id,
      eserviceId,
      knodeId,
    });

  const banner = match(agreement.state)
    .with("Active", () => (
      <>
        <Banner
          action={
            canManageAgreement
              ? {
                  label: "Suspend",
                  onPress: () => setIsSuspendModalOpen(true),
                }
              : undefined
          }
          kind="success"
        >
          Active
        </Banner>
        <DialogTrigger
          isOpen={isSuspendModalOpen}
          onOpenChange={setIsSuspendModalOpen}
        >
          <Modal
            actionLabel="Suspend anyway"
            cancelLabel="Cancel"
            confirmButtonProps={{ isPending: isSuspendPending }}
            isDismissable
            kind="destructive"
            onClose={() => setIsSuspendModalOpen(false)}
            onConfirm={suspendAgreement}
            onDismiss={() => setIsSuspendModalOpen(false)}
            showErrorBanner={isSuspendError}
            title="Suspend Agreement"
          >
            <p className="body-md">
              If you suspend it, the Producer won&apos;t be able to reactivate
              the Agreement on your behalf. Are you sure you want to suspend
              this Agreement?
            </p>
            <p className="body-md">You will be able to reactivate it later.</p>
          </Modal>
        </DialogTrigger>
      </>
    ))
    .with("Suspended", () => (
      <Banner
        action={
          canManageAgreement
            ? {
                label: "Archive",
                // TODO: implement archive agreement action
              }
            : undefined
        }
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
    ))
    .with("Archived", () => {
      console.warn(
        "Unexpected Archived agreement in consumption status section",
      );
      return null;
    })
    .with("PendingConsumerOperatorIdentification", () => {
      console.warn(
        "Unhandled agreement state: PendingConsumerOperatorIdentification",
      );
      return null;
    })
    .exhaustive();

  if (!banner) return null;

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
