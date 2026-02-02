import { useStepsContext } from "@/contexts/steps";

import { Footer } from "../Footer";
import { StepTitle } from "../StepsTitle";

export function AttributesStep() {
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="flex flex-col gap-6">
      <StepTitle
        description="Choose which organization can request an Agreement for your E-Service."
        title="Attributes"
      />

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </div>
  );
}
