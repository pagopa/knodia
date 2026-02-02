import { TextArea, TextField, Typography } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";

interface Props {
  onCancel: () => void;
}

export function GeneralStep({ onCancel }: Props) {
  const form = useEServiceFormContext();
  const { nextStep } = useStepsContext();

  return (
    <div className="space-y-6">
      <div>
        <Typography className="headline-lg-em">General Information</Typography>
        <Typography variant="bodyMd">
          This information will be used to find your E-Service. Be precise and
          clear.
        </Typography>
      </div>

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
