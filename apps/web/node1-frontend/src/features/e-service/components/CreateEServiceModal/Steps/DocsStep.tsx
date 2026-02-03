import { useStepsContext } from "@/contexts/steps";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function DocsStep() {
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="flex flex-col gap-6">
      <StepHeader description="Upload the API specs files." title="Documents" />

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </div>
  );
}
