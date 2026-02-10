import { categories } from "@knodia/category-models";
import {
  Button,
  Select,
  SelectItem,
  TextArea,
  TextField,
} from "@knodia/ui-kit/ui";
import { BookOpenTextIcon } from "@phosphor-icons/react";

import { useStepsContext } from "@/contexts/steps";
import { useGeneralStepForm } from "@/features/e-service/contexts/useEServiceFormContext";
import { getFieldErrorMessage } from "@/features/e-service/utils/getFieldErrorMessage";

import { Footer } from "../components/Footer";
import { StepHeader } from "../components/StepHeader";

interface Props {
  onCancel: () => void;
}

export function GeneralStep({ onCancel }: Props) {
  const { nextStep } = useStepsContext();
  const form = useGeneralStepForm(nextStep);

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

          <div className="flex gap-4 justify-between items-end">
            <form.Field name="categories">
              {(field) => (
                <Select
                  className="flex-1"
                  label="Categories (optional)"
                  name={field.name}
                  onChange={(keys) =>
                    field.handleChange(
                      keys.map((v) => {
                        const key = String(v);
                        const [scheme = "", code = ""] = key.split("$");
                        return { code, scheme };
                      }),
                    )
                  }
                  placeholder="Select categories"
                  selectionMode="multiple"
                  value={
                    field.state.value?.map((c) => `${c.scheme}$${c.code}`) ?? []
                  }
                >
                  {Object.entries(categories).flatMap(([scheme, codes]) =>
                    Object.entries(codes).map(([code, name]) => (
                      <SelectItem
                        id={`${scheme}$${code}`}
                        key={`${scheme}$${code}`}
                      >
                        {name}
                      </SelectItem>
                    )),
                  )}
                </Select>
              )}
            </form.Field>

            <Button hierarchy="neutral" kind="ghost" size="lg">
              <BookOpenTextIcon />
              Categories list
            </Button>
          </div>
        </div>
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Footer
            cancelLabel="Back"
            isDisabled={!canSubmit}
            onCancel={onCancel}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}
