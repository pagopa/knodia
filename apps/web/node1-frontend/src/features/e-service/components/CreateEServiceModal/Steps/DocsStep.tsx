import { Banner, FileUpload } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function DocsStep() {
  const form = useEServiceFormContext();
  const { nextStep, prevStep } = useStepsContext();

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
            API specs
          </h3>
          <form.Field name="interfaceDocument">
            {() => (
              <FileUpload
                description="Accepted format: YAML, JSON, XML"
                // TODO: handle file change and other field props
              />
            )}
          </form.Field>
        </div>
      </div>
      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </>
  );
}
