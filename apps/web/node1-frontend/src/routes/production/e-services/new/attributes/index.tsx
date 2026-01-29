import { Typography } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { Footer } from "@/features/e-service/components/createFormSteps/Footer";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/attributes/")({
  component: AttributesStepRoute,
});

const AttributesStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function AttributesStep() {
    const { nextStep, prevStep } = useStepsContext();

    return (
      <div className="space-y-6">
        <div>
          <Typography className="headline-lg-em">Attributes</Typography>
          <Typography variant="bodyMd">
            Choose which organization can request an Agreement for your
            E-Service.
          </Typography>
        </div>

        <Footer onCancel={prevStep} onConfirm={nextStep} />
      </div>
    );
  },
});

function AttributesStepRoute() {
  const form = useEServiceForm();
  return <AttributesStepForm form={form} />;
}
