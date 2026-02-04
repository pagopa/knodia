import { Banner, Button, FieldError, Select } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import {
  useAttributesStepForm,
  useEServiceWizardContext,
} from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function AttributesStep() {
  const { data, updateAttributesStep } = useEServiceWizardContext();
  const { nextStep, prevStep } = useStepsContext();

  const form = useAttributesStepForm(
    {
      requiredAttributes: data.requiredAttributes ?? [],
    },
    (stepData) => {
      updateAttributesStep(stepData);
      nextStep();
    },
  );

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="Choose which organization can request an Agreement for your E-Service."
          title="Attributes"
        >
          <Banner kind="informative">
            E-Services' attributes cannot be modified after publication.
          </Banner>
          <p className="body-md text-primary-dark">
            Organizations must have at least one attribute within a group to
            request an Agreement for your E-Service. If you want to request that
            Consumers have more than one attribute, create separate groups.
          </p>
        </StepHeader>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="headline-sm-em text-primary-light-high-contrast">
              Group 1 *
            </h3>
            <span className="body-md text-primary-light-high-contrast">
              Organizations must have at least one attribute inside this group.
            </span>
          </div>
          <form.Field name="requiredAttributes">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Select
                  children={undefined} // TODO: add attributes
                  className="flex-1"
                  isRequired
                  label="Attributes"
                  name={field.name}
                  placeholder="Select one or more attributes"
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <FieldError>
                    {field.state.meta.errors.map((e) => e?.message).join(", ")}
                  </FieldError>
                )}
              </div>
            )}
          </form.Field>
        </div>

        <Button className="self-start" hierarchy="neutral" kind="tonal">
          Add group
        </Button>
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Footer
            isDisabled={!canSubmit}
            onCancel={prevStep}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}
