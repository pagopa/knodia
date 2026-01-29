import type { EserviceMode } from "@knodia/eservice-models";

import { Button, Radio, RadioGroup } from "@knodia/ui-kit/ui";
import { createFileRoute } from "@tanstack/react-router";

import { withForm } from "@/contexts/form";
import { useStepsContext } from "@/contexts/steps/useStepsContext";
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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Technical</h2>

        <form.Field name="mode">
          {(field) => (
            <RadioGroup<EserviceMode>
              label="Mode"
              onChange={field.handleChange}
              value={field.state.value}
            >
              <Radio value="ProvideData">Provide Data</Radio>
              <Radio value="ReceiveData">Receive Data</Radio>
            </RadioGroup>
          )}
        </form.Field>

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

function TechnicalStepRoute() {
  const form = useEServiceForm();
  return <TechnicalStepForm form={form} />;
}
