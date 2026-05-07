import { Banner } from "@knodia/ui-kit/ui";
import { useStore } from "@tanstack/react-form";
import { useMemo } from "react";

import type {
  FormValues,
  JsonSchema,
  UISchema,
} from "@/features/purpose/engine/types";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import {
  useDynamicStepForm,
  usePurposeWizardContext,
} from "@/features/purpose/contexts/usePurposeFormContext";
import { createAjvValidator } from "@/features/purpose/engine/ajv/validation";
import { getVisibleFields } from "@/features/purpose/engine/dependencyResolver";
import { stripHiddenOptionValuesFromAnswers } from "@/features/purpose/engine/optionFilter";
import { scopeToFieldName } from "@/features/purpose/engine/scope";
import {
  collectErrorMessages,
  collectGroups,
  type GroupLayout,
  type StepLayout,
} from "@/features/purpose/engine/uischemaParser";
import { useCreatePurpose } from "@/features/purpose/hooks/useCreatePurpose";
import { useVisibleFields } from "@/features/purpose/hooks/useVisibleFields";

import { FieldRenderer } from "../renderers/FieldRenderer";
import { TemplateNotice } from "../TemplateNotice";

interface Props {
  isLastStep: boolean;
  jsonSchema: JsonSchema;
  step: StepLayout;
  texts: Record<string, string>;
  uischema: UISchema;
}

export function DynamicFormStep({
  isLastStep,
  jsonSchema,
  step,
  texts,
  uischema,
}: Props) {
  const { nextStep, prevStep } = useStepsContext();
  const { eserviceId, formAnswers, knodeId, updateFormAnswers } =
    usePurposeWizardContext();
  const { createPurpose, isError, isPending } = useCreatePurpose(
    eserviceId,
    knodeId,
  );

  const stepUischema: UISchema = useMemo(
    () => ({ elements: step.elements, type: "VerticalLayout" as const }),
    [step.elements],
  );

  const errorMessages = useMemo(
    () => collectErrorMessages(texts, uischema),
    [texts, uischema],
  );

  const validate = useMemo(
    () => createAjvValidator(jsonSchema, errorMessages, uischema),
    [jsonSchema, errorMessages, uischema],
  );

  const form = useDynamicStepForm({
    formAnswers,
    jsonSchema,
    onDynamic: ({ value }) => {
      const fieldErrors = validate(value, stepVisibleFields);
      if (Object.keys(fieldErrors).length === 0) return undefined;
      return { fields: fieldErrors };
    },
    onSubmitSuccess: (value) => {
      updateFormAnswers(value);

      if (isLastStep) {
        const mergedAnswers = { ...formAnswers, ...value };
        const cleanedAnswers = stripHiddenOptionValuesFromAnswers(
          mergedAnswers,
          uischema,
        );
        const fullVisible = getVisibleFields(uischema, cleanedAnswers);
        const filteredAnswers: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(cleanedAnswers)) {
          if (!fullVisible.has(key)) continue;
          if (Array.isArray(val) ? val.length === 0 : val === "") continue;
          filteredAnswers[key] = val;
        }
        createPurpose({ formAnswersJson: filteredAnswers });
      } else {
        nextStep();
      }
    },
  });

  const values = useStore(form.store, (state) => state.values);

  const { visibleFieldNames } = useVisibleFields(uischema, values);

  const stepVisible = getVisibleFields(stepUischema, values);
  const stepVisibleFields = new Set(
    [...stepVisible].filter((f) => visibleFieldNames.has(f)),
  );

  const groups = useMemo(
    () => collectGroups(stepUischema, texts),
    [stepUischema, texts],
  );

  const visibleGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.elements.some((el) =>
          visibleFieldNames.has(scopeToFieldName(el.scope)),
        ),
      ),
    [groups, visibleFieldNames],
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {step.label && (
          <StepHeader description={step.description ?? ""} title={step.label} />
        )}

        <TemplateNotice />

        {visibleGroups.map((group, groupIndex) => (
          <GroupSection
            form={form}
            group={group}
            isLast={groupIndex === visibleGroups.length - 1}
            jsonSchema={jsonSchema}
            key={group.label ?? groupIndex}
            texts={texts}
            values={values}
            visibleFieldNames={visibleFieldNames}
          />
        ))}
      </div>

      {isError && (
        <Banner kind="error" size="md" title="Something went wrong">
          Please try again. Don&apos;t refresh the page to avoid data loss.
        </Banner>
      )}

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <ModalFooter
            cancelLabel="Previous"
            confirmLabel={isLastStep ? "Create Purpose" : "Next"}
            isDisabled={!canSubmit || isPending}
            onCancel={prevStep}
            onConfirm={() => form.handleSubmit()}
          />
        )}
      </form.Subscribe>
    </>
  );
}

function GroupSection({
  form,
  group,
  isLast,
  jsonSchema,
  texts,
  values,
  visibleFieldNames,
}: {
  form: ReturnType<typeof useDynamicStepForm>;
  group: GroupLayout;
  isLast: boolean;
  jsonSchema: JsonSchema;
  texts: Record<string, string>;
  values: FormValues;
  visibleFieldNames: Set<string>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {group.label && (
        <div className="flex flex-col gap-3">
          <h3 className="title-sm-em text-primary-light-high-contrast">
            {group.label}
          </h3>
          {group.description && (
            <p className="body-sm text-primary-light-mid-contrast whitespace-pre-line">
              {group.description}
            </p>
          )}
        </div>
      )}
      {group.elements.map((element) => {
        const fieldName = scopeToFieldName(element.scope);
        if (!visibleFieldNames.has(fieldName)) return null;
        return (
          <form.Field key={fieldName} name={fieldName}>
            {(field) => {
              const rawError = field.state.meta.errorMap.onDynamic;
              const error = typeof rawError === "string" ? rawError : undefined;
              return (
                <FieldRenderer
                  allValues={values}
                  control={element}
                  error={error}
                  jsonSchema={jsonSchema}
                  onChange={(v) => field.handleChange(v)}
                  texts={texts}
                  value={
                    field.state.value ??
                    (jsonSchema.properties[fieldName]?.type === "array"
                      ? []
                      : "")
                  }
                />
              );
            }}
          </form.Field>
        );
      })}
      {!isLast && <hr className="border-primary-light-decorative mt-2" />}
    </div>
  );
}
