import { Steps } from "@knodia/ui-kit/ui";
import { match } from "ts-pattern";

import { StepsProvider, useStepsContext } from "@/contexts/steps";
import { EServiceFormProvider } from "@/features/e-service/contexts/EServiceFormContext";
import { FullPageModal } from "@/layouts/FullPageModal";

import { CREATE_FORM_STEPS } from "../../types/eserviceCreateForm";
import { AttributesStep } from "./Steps/AttributesStep";
import { DocsStep } from "./Steps/DocsStep";
import { GeneralStep } from "./Steps/GeneralStep";
import { RecapStep } from "./Steps/RecapStep";
import { TechnicalStep } from "./Steps/TechnicalStep";

interface Props {
  onClose: () => void;
}

export function CreateEServiceModal({ onClose }: Props) {
  const handleClose = () => {
    onClose();
  };

  return (
    <FullPageModal onClose={handleClose} title="Create E-Service">
      <StepsProvider stepConfig={CREATE_FORM_STEPS}>
        <EServiceFormProvider>
          <ModalContent onClose={handleClose} />
        </EServiceFormProvider>
      </StepsProvider>
    </FullPageModal>
  );
}

function ModalContent({ onClose }: Props) {
  const { currentStepIndex, steps } = useStepsContext();
  const stepLabels = steps.map((s) => s.label);

  const currentStep = match(currentStepIndex)
    .with(0, () => <GeneralStep onCancel={onClose} />)
    .with(1, () => <TechnicalStep />)
    .with(2, () => <DocsStep />)
    .with(3, () => <AttributesStep />)
    .with(4, () => <RecapStep />)
    .otherwise(() => null);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Steps
          ariaLabel="E-Service creation steps"
          current={currentStepIndex}
          steps={stepLabels}
        />
      </div>
      {currentStep}
    </div>
  );
}
