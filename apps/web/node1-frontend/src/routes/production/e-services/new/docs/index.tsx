import { Button } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/docs/")({
  component: DocsStepRoute,
});

const DocsStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function DocsStep({ form: _form }) {
    const { nextStep, prevStep } = useStepsContext();

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Docs</h2>

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

function DocsStepRoute() {
  const form = useEServiceForm();
  return <DocsStepForm form={form} />;
}
