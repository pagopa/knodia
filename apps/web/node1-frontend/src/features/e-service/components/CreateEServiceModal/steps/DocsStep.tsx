import { Banner, FileUpload } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useDocsStepForm } from "@/features/e-service/contexts/useEServiceFormContext";
import { getFieldErrorMessage } from "@/features/e-service/utils/getFieldErrorMessage";

import { DocumentRecap } from "../components/DocumentRecap";
import { Footer } from "../components/Footer";
import { StepHeader } from "../components/StepHeader";

export function DocsStep() {
  const { nextStep, prevStep } = useStepsContext();
  const form = useDocsStepForm(nextStep);

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

          <div className="flex flex-col gap-4">
            <form.Subscribe selector={(state) => state.values}>
              {(values) =>
                values.interfaceDocument && (
                  <DocumentRecap name={values.interfaceDocument.name} />
                )
              }
            </form.Subscribe>
            <form.Field name="interfaceDocument">
              {(field) => (
                <FileUpload
                  description="Accepted format: YAML, JSON, XML (up to 1 MB)."
                  errorMessage={getFieldErrorMessage(field.state.meta.errors)}
                  onSelect={(files) => {
                    const file = files?.[0] ?? null;
                    field.handleChange(file);
                  }}
                />
              )}
            </form.Field>
          </div>
        </div>
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
