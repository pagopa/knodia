import { categories } from "@knodia/category-models";
import { Button, Select, TextArea, TextField } from "@knodia/ui-kit/ui";
import { BookOpenTextIcon } from "@phosphor-icons/react";

import type { SchemeRef } from "@/types/schemeRef";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import {
  useEServiceWizardContext,
  useGeneralStepForm,
} from "@/features/e-service/contexts/useEServiceFormContext";
import {
  parseSchemeRefKeys,
  renderSchemeRefItems,
  toSchemeRefKey,
} from "@/features/e-service/utils/schemeRef";
import { getFieldErrorMessage } from "@/utils/getFieldErrorMessage";

import { CategoryChip } from "../../CategoryChip";

interface Props {
  onCancel: () => void;
}

export function GeneralStep({ onCancel }: Props) {
  const { nextStep } = useStepsContext();
  const form = useGeneralStepForm(nextStep);
  const { template } = useEServiceWizardContext();

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

          <CategoriesField
            form={form}
            isDefinedByTemplate={template !== undefined}
          />
        </div>
      </div>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ModalFooter
            cancelLabel="Cancel"
            isDisabled={!canSubmit}
            onCancel={onCancel}
            onConfirm={form.handleSubmit}
          />
        )}
      </form.Subscribe>
    </>
  );
}

function CategoriesField({
  form,
  isDefinedByTemplate,
}: {
  form: ReturnType<typeof useGeneralStepForm>;
  isDefinedByTemplate: boolean;
}) {
  return (
    <form.Field name="categories">
      {(field) => {
        const selectedCategories = field.state.value ?? [];

        if (isDefinedByTemplate) {
          return (
            <div>
              <div className="label-sm text-primary-light-low-contrast mb-2">
                Categories
              </div>
              <ReadOnlyCategoriesList categories={selectedCategories} />
            </div>
          );
        }

        return (
          <div className="flex gap-4 justify-between items-end">
            <Select
              className="flex-1"
              label="Categories (optional)"
              name={field.name}
              onChange={(keys) => field.handleChange(parseSchemeRefKeys(keys))}
              placeholder="Select categories"
              selectionMode="multiple"
              value={selectedCategories.map(toSchemeRefKey)}
            >
              {renderSchemeRefItems(categories)}
            </Select>
            <Button hierarchy="neutral" kind="ghost" size="lg">
              <BookOpenTextIcon />
              Categories list
            </Button>
          </div>
        );
      }}
    </form.Field>
  );
}

function ReadOnlyCategoriesList({ categories }: { categories: SchemeRef[] }) {
  return (
    <ul
      aria-label="Selected categories"
      className="flex flex-wrap gap-2"
      role="list"
    >
      {categories.map((category, i) => (
        <li key={i}>
          <CategoryChip {...category} />
        </li>
      ))}
    </ul>
  );
}
