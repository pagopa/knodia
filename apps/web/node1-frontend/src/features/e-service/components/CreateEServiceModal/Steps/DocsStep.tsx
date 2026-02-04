import { Banner, FieldError, FileUpload } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import {
  useDocsStepForm,
  useEServiceWizardContext,
} from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function DocsStep() {
  const { data, updateDocsStep } = useEServiceWizardContext();
  const { nextStep, prevStep } = useStepsContext();

  const form = useDocsStepForm(
    {
      interfaceDocument: data.interfaceDocument ?? null,
    },
    (stepData) => {
      updateDocsStep(stepData);
      nextStep();
    },
  );

  function handleNext() {
    void form.handleSubmit();
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader description="Upload the API specs files." title="Documents">
          <Banner kind="informative">
            The API specs file cannot be modified after publication.
          </Banner>
        </StepHeader>

        <div className="flex flex-col gap-6">
          <h3 className="title-sm-em text-secondary-light-low-contrast">
            API specs *
          </h3>
          <form.Field name="interfaceDocument">
            {(field) => (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <FileUpload
                    description="Accepted format: YAML, JSON, XML"
                    onSelect={(files) => {
                      const file = files?.[0] ?? null;
                      field.handleChange(file);
                    }}
                  />
                  {field.state.value && (
                    <span className="body-md text-primary-light-high-contrast">
                      {field.state.value.name}
                    </span>
                  )}
                </div>
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <FieldError>
                    {field.state.meta.errors.map((e) => e?.message).join(", ")}
                  </FieldError>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Footer
            isDisabled={!canSubmit}
            onCancel={prevStep}
            onConfirm={handleNext}
          />
        )}
      </form.Subscribe>
    </>
  );
}
