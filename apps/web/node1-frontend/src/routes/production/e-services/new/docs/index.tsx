import { Typography } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { Footer } from "@/features/e-service/components/createFormSteps/Footer";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/docs/")({
  component: DocsStepRoute,
});

const DocsStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function DocsStep() {
    const { nextStep, prevStep } = useStepsContext();

    return (
      <div className="space-y-6">
        <div>
          <Typography className="headline-sm-em">Documents</Typography>
          <Typography variant="bodySm">Upload the API specs file.</Typography>
        </div>

        <Footer onCancel={prevStep} onConfirm={nextStep} />
      </div>
    );
  },
});

function DocsStepRoute() {
  const form = useEServiceForm();
  return <DocsStepForm form={form} />;
}
