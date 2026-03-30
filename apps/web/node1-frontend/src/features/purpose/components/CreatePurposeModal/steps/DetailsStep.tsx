import { NumberField, TextArea, TextField } from "@knodia/ui-kit/ui";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import {
  useDetailsStepForm,
  usePurposeWizardContext,
} from "@/features/purpose/contexts/usePurposeFormContext";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

interface Props {
  onCancel: () => void;
}

export function DetailsStep({ onCancel }: Props) {
  const { eserviceName, maxDailyCallsPerConsumer } = usePurposeWizardContext();
  const { nextStep } = useStepsContext();
  const form = useDetailsStepForm(() => nextStep());

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Provide details about why you need to access this E-Service."
          title="Purpose details"
        />

        <div className="bg-secondary-light flex flex-col gap-3 rounded-lg p-6">
          <span className="label-lg text-primary-light-low-contrast">
            E-Service
          </span>
          <span className="title-md-em text-primary-light-high-contrast">
            {eserviceName}
          </span>
        </div>

        <div className="flex flex-col gap-6">
          <form.Field name="name">
            {(field) => (
              <TextField
                description="Min 5 characters, max 60 characters"
                errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                isInvalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                isRequired
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
                description="Min 10 characters, max 250 characters"
                errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                isInvalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                isRequired
                label="Description"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>

          <form.Field name="dailyCalls">
            {(field) => (
              <NumberField
                description={`This E-Service allows up to ${maxDailyCallsPerConsumer} API calls/day. If you need more calls, contact the Producer.`}
                errorMessage={getFieldErrorMessage(field.state.meta.errors, {
                  numberFallback: "Please enter a valid number.",
                })}
                isInvalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                isRequired
                label="How many API calls do you plan to make per day?"
                minValue={0}
                onBlur={field.handleBlur}
                onChange={(value) => field.handleChange(value)}
                value={field.state.value}
              />
            )}
          </form.Field>
        </div>
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ModalFooter
            cancelLabel="Cancel"
            confirmLabel="Next"
            isDisabled={!canSubmit}
            onCancel={onCancel}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}
