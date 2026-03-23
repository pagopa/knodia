import { Steps } from "@knodia/ui-kit/ui";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useStepsContext,
} from "@/contexts/steps";
import { EServiceFormProvider } from "@/features/e-service/contexts/EServiceFormProvider";
import { useLeaveConfirmModal } from "@/hooks/useLeaveConfirmModal";
import { FullPageModal } from "@/layouts/FullPageModal";

import { AttributesStep } from "./steps/AttributesStep";
import { DocsStep } from "./steps/DocsStep";
import { GeneralStep } from "./steps/GeneralStep";
import { RecapStep } from "./steps/RecapStep";
import { TechnicalStep } from "./steps/TechnicalStep";

interface Props {
  onClose: () => void;
}

export function CreateEServiceModal({ onClose }: Props) {
  const { modal: leaveConfirmModal, onModalShow: handleShowLeaveConfirm } =
    useLeaveConfirmModal(onClose);

  const steps: StepConfig[] = [
    {
      content: <GeneralStep onCancel={handleShowLeaveConfirm} />,
      label: "General",
    },
    { content: <TechnicalStep />, label: "Technical" },
    { content: <DocsStep />, label: "Docs" },
    { content: <AttributesStep />, label: "Attributes" },
    { content: <RecapStep />, label: "Recap" },
  ];

  return (
    <>
      <FullPageModal onClose={handleShowLeaveConfirm} title="Create E-Service">
        <StepsProvider stepConfig={steps}>
          <EServiceFormProvider>
            <ModalContent />
          </EServiceFormProvider>
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
    <div className="mx-auto max-w-160 p-10 pb-16 flex flex-col gap-16">
      <Steps
        ariaLabel="E-Service creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      {content}
    </div>
  );
}
