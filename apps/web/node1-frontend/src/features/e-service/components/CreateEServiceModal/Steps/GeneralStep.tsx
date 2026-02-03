import { Button, Select, TextArea, TextField } from "@knodia/ui-kit/ui";
import { BookOpenTextIcon } from "@phosphor-icons/react";

import { useStepsContext } from "@/contexts/steps";
import { useEServiceFormContext } from "@/features/e-service/contexts/useEServiceFormContext";

import { Footer } from "../Footer";
import { StepHeader } from "../StepsHeader";

interface Props {
  onCancel: () => void;
}

export function GeneralStep({ onCancel }: Props) {
  const form = useEServiceFormContext();
  const { nextStep } = useStepsContext();

  return (
    <>
      <div className="flex flex-col gap-10">
        <StepHeader
          description="This information will be used to find your E-Service. Be precise and clear."
          title="General Information"
        />

        <div className="flex flex-col gap-6">
          <form.Field name="name">
            {(field) => (
              <TextField
                description="Min 5 characters, max 60 characters"
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
                label="Description"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>

          <div className="flex gap-4 justify-between items-end">
            <form.Field name="categories">
              {(field) => (
                <Select
                  children={undefined} // TODO: add categories
                  className="flex-1"
                  label="Categories (optional)"
                  name={field.name}
                  placeholder="Select categories"
                />
              )}
            </form.Field>

            <Button hierarchy="neutral" kind="ghost" size="lg">
              <BookOpenTextIcon />
              Categories list
            </Button>
          </div>
        </div>
      </div>

      <Footer cancelLabel="Back" onCancel={onCancel} onConfirm={nextStep} />
    </>
  );
}
