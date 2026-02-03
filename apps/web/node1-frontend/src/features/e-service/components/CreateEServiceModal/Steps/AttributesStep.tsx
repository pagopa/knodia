import { Banner, Button, Select } from "@knodia/ui-kit/ui";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

export function AttributesStep() {
  const form = useEServiceFormContext();
  const { nextStep, prevStep } = useStepsContext();

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
              Group 1
            </h3>
            <span className="body-md text-primary-light-high-contrast">
              Organizations must have at least one attribute inside this group.
            </span>
          </div>
          <form.Field name="requiredAttributes">
            {(field) => (
              <Select
                children={undefined} // TODO: add attributes
                className="flex-1"
                label="Attributes"
                name={field.name}
                placeholder="Select one or more attributes"
              />
            )}
          </form.Field>
        </div>

        <Button className="self-start" hierarchy="neutral" kind="tonal">
          Add group
        </Button>
      </div>
      <Footer onCancel={prevStep} onConfirm={nextStep} />
    </>
  );
}
