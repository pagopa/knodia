import type { bffApi } from "@knodia/bff-client";

import { Steps } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { StepsProvider, useStepsContext } from "@/contexts/steps";
import { useLeaveConfirmModal } from "@/features/e-service/hooks/useLeaveConfirmModal";
import { PurposeFormProvider } from "@/features/purpose/contexts/PurposeFormProvider";
import { CREATE_PURPOSE_STEPS } from "@/features/purpose/types/purposeCreateForm";
import { FullPageModal } from "@/layouts/FullPageModal";

import { DetailsStep } from "./steps/DetailsStep";

interface Props {
  eserviceId: string;
  eserviceName: string;
  knodeId: bffApi.KnodeId;
  onClose: () => void;
}

export function CreatePurposeModal({
  eserviceId,
  eserviceName,
  knodeId,
  onClose,
}: Props) {
  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  return (
    <>
      <FullPageModal onClose={handleShowLeaveConfirm} title="Create Purpose">
        <StepsProvider stepConfig={CREATE_PURPOSE_STEPS}>
          <PurposeFormProvider>
            <ModalContent
              eserviceId={eserviceId}
              eserviceName={eserviceName}
              knodeId={knodeId}
              onCloseRequest={handleShowLeaveConfirm}
            />
          </PurposeFormProvider>
        </StepsProvider>
      </FullPageModal>

      {leaveConfirmModal}
    </>
  );
}

function ModalContent({
  eserviceId,
  eserviceName,
  knodeId,
  onCloseRequest,
}: {
  eserviceId: string;
  eserviceName: string;
  knodeId: bffApi.KnodeId;
  onCloseRequest: () => void;
}) {
  const { currentStepIndex, steps } = useStepsContext();
  const stepLabels = steps.map((s) => s.label);

  // TODO: Steps 2 and 3 will be replaced with the proper dynamic form
  // generated from the Knode's JSON schema once that feature is implemented
  const currentStep = match(currentStepIndex)
    .with(0, () => (
      <DetailsStep
        eserviceId={eserviceId}
        eserviceName={eserviceName}
        knodeId={knodeId}
        onCancel={onCloseRequest}
      />
    ))
    .with(1, () => <PlaceholderStep label="Step 2" />)
    .with(2, () => <PlaceholderStep label="Step 3" />)
    .otherwise(() => null);

  return (
    <div className="mx-auto flex max-w-160 flex-col gap-16 p-10 pb-16">
      <Steps
        ariaLabel="Purpose creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      {currentStep}
    </div>
  );
}

function PlaceholderStep({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="body-lg text-primary-light-low-contrast">{label} - TODO</p>
    </div>
  );
}
