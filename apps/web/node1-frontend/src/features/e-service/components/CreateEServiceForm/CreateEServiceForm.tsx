import type { bffApi } from "@knodia/bff-client";

import { Steps } from "@knodia/ui-kit/ui";

import {
  type StepConfig,
  StepsProvider,
  useCurrentStep,
  useStepsContext,
} from "@/contexts/steps";
import { EServiceFormProvider } from "@/features/e-service/contexts/EServiceFormProvider";

import { AttributesStep } from "./steps/AttributesStep";
import { DocsStep } from "./steps/DocsStep";
import { GeneralStep } from "./steps/GeneralStep";
import { RecapStep } from "./steps/RecapStep";
import { TechnicalStep } from "./steps/TechnicalStep";

export function CreateEServiceForm({
  onLeave,
  template,
}: {
  onLeave: () => void;
  template: bffApi.EserviceTemplateDetails;
}) {
  const steps: StepConfig[] = [
    {
      content: <GeneralStep onCancel={onLeave} />,
      label: "General",
    },
    { content: <TechnicalStep />, label: "Technical" },
    { content: <DocsStep />, label: "Docs" },
    { content: <AttributesStep />, label: "Attributes" },
    { content: <RecapStep />, label: "Recap" },
  ];

  return (
    <>
      <StepsProvider stepConfig={steps}>
        <EServiceFormProvider template={template}>
          <EserviceFormCurrentStep />
        </EServiceFormProvider>
      </StepsProvider>
    </>
  );
}

function EserviceFormCurrentStep() {
  const { currentStepIndex, stepLabels } = useStepsContext();
  const { content } = useCurrentStep();

  return (
    <>
      <Steps
        ariaLabel="E-Service creation steps"
        current={currentStepIndex}
        steps={stepLabels}
      />
      {content}
    </>
  );
}
