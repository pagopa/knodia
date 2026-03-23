import type { KnodeId } from "@knodia/common-models/ids";

import { Steps } from "@knodia/ui-kit/ui";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useStepsContext,
} from "@/contexts/steps";
import { PurposeFormProvider } from "@/features/purpose/contexts/PurposeFormProvider";
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

  // TODO: Steps 2 and 3 will be replaced with the proper dynamic form
  // generated from the Knode's JSON schema once that feature is implemented
  const steps: StepConfig[] = [
    {
      content: <DetailsStep onCancel={handleShowLeaveConfirm} />,
      label: "Details",
    },
    { content: <PlaceholderStep label="Step 2" />, label: "Step 2" },
    { content: <PlaceholderStep label="Step 3" />, label: "Step 3" },
  ];

  return (
    <>
      <FullPageModal onClose={handleShowLeaveConfirm} title="Create Purpose">
        <StepsProvider stepConfig={steps}>
          <PurposeFormProvider eservice={eservice} knodeId={knodeId}>
            <ModalContent />
          </PurposeFormProvider>
        </StepsProvider>
      </FullPageModal>

      {leaveConfirmModal}
    </>
  );
}

function ModalContent() {
  const { currentStepIndex, stepLabels } = useStepsContext();
  const { content } = useCurrentStep();

  return (
    <div className="mx-auto flex max-w-160 flex-col gap-16 p-10 pb-16">
      <Steps
        ariaLabel="Purpose creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      {content}
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
