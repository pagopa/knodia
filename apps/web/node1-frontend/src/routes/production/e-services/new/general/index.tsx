import { Button, TextArea, TextField } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/general/")({
  component: GeneralStepRoute,
});

const GeneralStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function GeneralStep({ form }) {
    const { nextStep } = useStepsContext();

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">General</h2>

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

        <Button onPress={nextStep}>Next</Button>
      </div>
    );
  },
});

function GeneralStepRoute() {
  const form = useEServiceForm();
  return <GeneralStepForm form={form} />;
}
