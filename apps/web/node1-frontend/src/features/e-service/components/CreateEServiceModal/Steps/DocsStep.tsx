import { useStepsContext } from "@/contexts/steps";

import { Footer } from "../Footer";
import { StepTitle } from "../StepsTitle";

export function DocsStep() {
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="space-y-6">
      <StepTitle description="Upload the API specs files." title="Documents" />

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </div>
  );
}
