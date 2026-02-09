import { Steps } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { StepsProvider, useStepsContext } from "@/contexts/steps";
import { EServiceFormProvider } from "@/features/e-service/contexts/EServiceFormProvider";
import { FullPageModal } from "@/layouts/FullPageModal";

import { useLeaveConfirmModal } from "../../hooks/useLeaveConfirmModal";
import { CREATE_FORM_STEPS } from "../../types/eserviceCreateForm";
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

  return (
    <>
      <FullPageModal onClose={handleShowLeaveConfirm} title="Create E-Service">
        <StepsProvider stepConfig={CREATE_FORM_STEPS}>
          <EServiceFormProvider>
            <ModalContent onCloseRequest={handleShowLeaveConfirm} />
          </EServiceFormProvider>
        </StepsProvider>
      </FullPageModal>

      {leaveConfirmModal}
    </>
  );
}

function ModalContent({ onCloseRequest }: { onCloseRequest: () => void }) {
  const { currentStepIndex, steps } = useStepsContext();
  const stepLabels = steps.map((s) => s.label);

  const currentStep = match(currentStepIndex)
    .with(0, () => <GeneralStep onCancel={onCloseRequest} />)
    .with(1, () => <TechnicalStep />)
    .with(2, () => <DocsStep />)
    .with(3, () => <AttributesStep />)
    .with(4, () => <RecapStep />)
    .otherwise(() => null);

  return (
    <div className="mx-auto max-w-160 p-10 pb-16 flex flex-col gap-16">
      <Steps
        ariaLabel="E-Service creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      {currentStep}
    </div>
  );
}
