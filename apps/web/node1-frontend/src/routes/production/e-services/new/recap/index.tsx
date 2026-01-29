import { Typography } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
import { Footer } from "@/features/e-service/components/createFormSteps/Footer";
import { useEServiceForm } from "@/features/e-service/contexts/EServiceFormContext";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export const Route = createFileRoute("/production/e-services/new/recap/")({
  component: RecapStepRoute,
});

function RecapField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-secondary-light-mid-contrast">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

const RecapStepForm = withForm({
  defaultValues: ESERVICE_FORM_DEFAULTS,
  render: function RecapStep({ form }) {
    const { prevStep } = useStepsContext();
    const values = form.state.values;

    return (
      <div className="space-y-6">
        <div>
          <Typography className="headline-lg-em">Recap </Typography>
          <Typography variant="bodyMd">
            Check that everything is correct before the publication.
          </Typography>
        </div>

        <div className="rounded-lg border border-secondary-light-low-contrast p-4">
          <RecapField label="Name" value={values.name || "-"} />
          <RecapField label="Description" value={values.description || "-"} />
          <RecapField
            label="Access Token Duration"
            value={`${values.accessTokenDuration} seconds`}
          />
        </div>

        <Footer
          confirmLabel="Publish"
          onCancel={prevStep}
          onConfirm={() => form.handleSubmit()}
        />
      </div>
    );
  },
});

function RecapStepRoute() {
  const form = useEServiceForm();
  return <RecapStepForm form={form} />;
}
