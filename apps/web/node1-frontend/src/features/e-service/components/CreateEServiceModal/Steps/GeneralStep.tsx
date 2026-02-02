import { TextArea, TextField } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepTitle } from "../StepsTitle";

interface Props {
  onCancel: () => void;
}

export function GeneralStep({ onCancel }: Props) {
  const form = useEServiceFormContext();
  const { nextStep } = useStepsContext();

  return (
    <div className="space-y-6">
      <StepTitle
        description="This information will be used to find your E-Service. Be precise and clear."
        title="General Information"
      />

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
}
