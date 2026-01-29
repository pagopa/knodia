import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/attributes/")({
  component: AttributesStepRoute,
});

const AttributesStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function AttributesStep({ form: _form }) {
    const { nextStep, prevStep } = useStepsContext();

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Attributes</h2>

        <div className="flex gap-2">
          <Button hierarchy="neutral" kind="outlined" onPress={prevStep}>
            Back
          </Button>
          <Button onPress={nextStep}>Next</Button>
        </div>
      </div>
    );
  },
});

function AttributesStepRoute() {
  const form = useEServiceForm();
  return <AttributesStepForm form={form} />;
}
