import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function RecapStep() {
  const form = useEServiceFormContext();
  const { prevStep } = useStepsContext();
  const values = form.state.values;

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        description="Check that everything is correct before the publication."
        title="Recap"
      />

      <div className="rounded-lg border border-secondary-light-low-contrast p-4">
        <RecapField label="Name" value={values.name || "-"} />
        <RecapField label="Description" value={values.description || "-"} />
        <RecapField
          label="Access Token Duration"
          value={`${values.accessTokenDuration} seconds`}
        />
        <RecapField label="Categories" value={values.categories || "-"} />
      </div>

      <Footer
        confirmLabel="Publish"
        onCancel={prevStep}
        onConfirm={() => form.handleSubmit()}
      />
    </div>
  );
}

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
