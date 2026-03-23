import type { KnodeId } from "@knodia/common-models/ids";

import { Steps } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import { StepsProvider, useStepsContext } from "@/contexts/steps";
import { PurposeFormProvider } from "@/features/purpose/contexts/PurposeFormProvider";
import { CREATE_PURPOSE_STEPS } from "@/features/purpose/types/purposeCreateForm";
import { useLeaveConfirmModal } from "@/hooks/useLeaveConfirmModal";
import { FullPageModal } from "@/layouts/FullPageModal";

import { DetailsStep } from "./steps/DetailsStep";

interface Props {
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
  onClose: () => void;
}

export function CreatePurposeModal({ eservice, knodeId, onClose }: Props) {
  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  return (
    <>
      <FullPageModal onClose={handleShowLeaveConfirm} title="Create Purpose">
        <StepsProvider stepConfig={CREATE_PURPOSE_STEPS}>
          <PurposeFormProvider eservice={eservice} knodeId={knodeId}>
            <ModalContent onCloseRequest={handleShowLeaveConfirm} />
          </PurposeFormProvider>
        </StepsProvider>
      </FullPageModal>

      {leaveConfirmModal}
    </>
  );
}

function ModalContent({ onCloseRequest }: { onCloseRequest: () => void }) {
  const { currentStepIndex, steps } = useStepsContext();
  const stepLabels = steps.map((s) => s.label);

  // TODO: Steps 2 and 3 will be replaced with the proper dynamic form
  // generated from the Knode's JSON schema once that feature is implemented
  const currentStep = match(currentStepIndex)
    .with(0, () => <DetailsStep onCancel={onCloseRequest} />)
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
