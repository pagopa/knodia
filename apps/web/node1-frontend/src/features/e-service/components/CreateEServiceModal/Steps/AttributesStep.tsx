import { Typography } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";

import { Footer } from "../Footer";

export function AttributesStep() {
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="space-y-6">
      <div>
        <Typography className="headline-lg-em">Attributes</Typography>
        <Typography variant="bodyMd">
          Choose which organization can request an Agreement for your E-Service.
        </Typography>
      </div>

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </div>
  );
}
