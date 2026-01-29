import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/recap/")({
  component: RecapStepRoute,
});

const RecapStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function RecapStep({ form }) {
    const { prevStep } = useStepsContext();
    const values = form.state.values;

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recap</h2>

        <div className="space-y-2 rounded border p-4">
          <div>
            <span className="font-medium">Name:</span> {values.name}
          </div>
          <div>
            <span className="font-medium">Description:</span> {values.description}
          </div>
          <div>
            <span className="font-medium">Mode:</span> {values.mode}
          </div>
        </div>

        <div className="flex gap-2">
          <Button hierarchy="neutral" kind="outlined" onPress={prevStep}>
            Back
          </Button>
          <Button onPress={() => form.handleSubmit()}>Create E-Service</Button>
        </div>
      </div>
    );
  },
});

function RecapStepRoute() {
  const form = useEServiceForm();
  return <RecapStepForm form={form} />;
}
