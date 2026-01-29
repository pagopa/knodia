import { TextArea, TextField, Typography } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { Footer } from "@/features/e-service/components/createFormSteps/Footer";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/general/")({
  component: GeneralStepRoute,
});

const GeneralStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function GeneralStep({ form }) {
    const { nextStep } = useStepsContext();

    const onCancel = () => {
      form.reset();
      window.history.back();
    };

    return (
      <div className="space-y-6">
        <div>
          <Typography className="headline-sm-em">
            General Information
          </Typography>
          <Typography variant="bodySm">
            This information will be used to find your E-Service. Be precise and
            clear.
          </Typography>
        </div>

        <form.Field name="name">
          {(field) => (
            <TextField
              label="Name"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <TextArea
              label="Description"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

        <Footer cancelLabel="Back" onCancel={onCancel} onConfirm={nextStep} />
      </div>
    );
  },
});

function GeneralStepRoute() {
  const form = useEServiceForm();
  return <GeneralStepForm form={form} />;
}
