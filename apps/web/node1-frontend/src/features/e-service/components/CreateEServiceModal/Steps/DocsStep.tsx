import { Typography } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";

import { Footer } from "../Footer";

export function DocsStep() {
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="space-y-6">
      <div>
        <Typography className="headline-lg-em">Documents</Typography>
        <Typography variant="bodyMd">Upload the API specs file.</Typography>
      </div>

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </div>
  );
}
