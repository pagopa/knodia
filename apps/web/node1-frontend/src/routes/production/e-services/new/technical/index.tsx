import { TextField, Typography } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { Footer } from "@/features/e-service/components/createFormSteps/Footer";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/technical/")({
  component: TechnicalStepRoute,
});

const TechnicalStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function TechnicalStep({ form }) {
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
              onChange={(value) => field.handleChange(value)}
              value={field.state.value}
            />
          )}
        </form.Field>

        <Footer onCancel={prevStep} onConfirm={nextStep} />
      </div>
    );
  },
});

function TechnicalStepRoute() {
  const form = useEServiceForm();
  return <TechnicalStepForm form={form} />;
}
