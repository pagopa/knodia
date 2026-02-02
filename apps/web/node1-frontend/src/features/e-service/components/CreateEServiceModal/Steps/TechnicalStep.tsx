import { TextField } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepTitle } from "../StepsTitle";

export function TechnicalStep() {
  const form = useEServiceFormContext();
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="flex flex-col gap-6">
      <StepTitle
        description="Define the technical specifications of your E-Service."
        title="Technical details"
      />

      <form.Field name="accessTokenDuration">
        {(field) => (
          <TextField
            label="Access Token Duration (seconds)"
            name={field.name}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            value={field.state.value}
          />
        )}
      </form.Field>

      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </div>
  );
}
