import { TextField, Typography } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";

export function TechnicalStep() {
  const form = useEServiceFormContext();
  const { nextStep, prevStep } = useStepsContext();

  return (
    <div className="space-y-6">
      <div>
        <Typography className="headline-lg-em">Technical details</Typography>
        <Typography variant="bodyMd">
          Define the technical specifications of your E-Service.
        </Typography>
      </div>

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
