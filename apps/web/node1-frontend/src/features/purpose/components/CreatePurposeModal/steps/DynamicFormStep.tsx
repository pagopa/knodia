import { Banner } from "@knodia/ui-kit/ui";
import { useCallback, useMemo, useState } from "react";

import type {
  FormValues,
  JsonSchema,
  UISchema,
} from "@/features/purpose/engine/types";

import { ModalFooter } from "@/components/ModalFooter";
import { StepHeader } from "@/components/StepHeader";
import { useStepsContext } from "@/contexts/steps";
import { usePurposeWizardContext } from "@/features/purpose/contexts/usePurposeFormContext";
import { createAjvValidator } from "@/features/purpose/engine/ajv/validation";
import {
  getVisibleFields,
  isLabelVisible,
  scopeToFieldName,
} from "@/features/purpose/engine/dependencyResolver";
import { getDefaultValues } from "@/features/purpose/engine/schemaParser";
import {
  collectErrorMessages,
  collectGroups,
  type GroupLayout,
  type StepLayout,
} from "@/features/purpose/engine/uischemaParser";
import { useCreatePurpose } from "@/features/purpose/hooks/useCreatePurpose";
import { useVisibleFields } from "@/features/purpose/hooks/useVisibleFields";

import { FieldRenderer } from "../renderers/FieldRenderer";
import { InfoBanner } from "../renderers/InfoBanner";

interface Props {
  isLastStep: boolean;
  jsonSchema: JsonSchema;
  step: StepLayout;
  uischema: UISchema;
}

export function DynamicFormStep({
  isLastStep,
  jsonSchema,
  step,
  uischema,
}: Props) {
  const { nextStep, prevStep } = useStepsContext();
  const { eserviceId, formAnswers, knodeId, updateFormAnswers } =
    usePurposeWizardContext();
  const { createPurpose, isError, isPending } = useCreatePurpose(
    eserviceId,
    knodeId,
  );

  const [values, setValues] = useState<FormValues>(() => ({
    ...getDefaultValues(jsonSchema),
    ...formAnswers,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const stepUischema: UISchema = useMemo(
    () => ({ elements: step.elements, type: "VerticalLayout" as const }),
    [step.elements],
  );

  const { visibleFieldNames } = useVisibleFields(uischema, values);

  const stepVisibleFields = useMemo(() => {
    const stepVisible = getVisibleFields(stepUischema, values);
    return new Set([...stepVisible].filter((f) => visibleFieldNames.has(f)));
  }, [stepUischema, values, visibleFieldNames]);

  const errorMessages = useMemo(
    () => collectErrorMessages(uischema),
    [uischema],
  );

  const validate = useMemo(
    () => createAjvValidator(jsonSchema, errorMessages),
    [jsonSchema, errorMessages],
  );

  const handleChange = useCallback(
    (fieldName: string, newValue: string | string[]) => {
      setValues((prev) => ({ ...prev, [fieldName]: newValue }));
      if (submitted) {
        setErrors((prev) =>
          Object.fromEntries(
            Object.entries(prev).filter(([key]) => key !== fieldName),
          ),
        );
      }
    },
    [submitted],
  );

  const handleNext = useCallback(() => {
    setSubmitted(true);
    const fieldErrors = validate(values, stepVisibleFields);

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      requestAnimationFrame(() => {
        const firstInvalid = document.querySelector("[data-invalid=true]");
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setErrors({});
    updateFormAnswers(values);

    if (isLastStep) {
      // Filter out empty/default values before submitting
      const allAnswers = { ...formAnswers, ...values };
      const filteredAnswers: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(allAnswers)) {
        if (Array.isArray(value) ? value.length > 0 : value !== "") {
          filteredAnswers[key] = value;
        }
      }
      createPurpose({ formAnswersJson: filteredAnswers });
    } else {
      nextStep();
    }
  }, [
    validate,
    values,
    stepVisibleFields,
    updateFormAnswers,
    isLastStep,
    formAnswers,
    createPurpose,
    nextStep,
  ]);

  const groups = useMemo(() => collectGroups(stepUischema), [stepUischema]);

  const visibleGroups = useMemo(
    () =>
      groups.filter((group) =>
        group.elements.some(
          (el) =>
            (el.type === "Control" &&
              visibleFieldNames.has(scopeToFieldName(el.scope))) ||
            (el.type === "Label" &&
              isLabelVisible(el, values, visibleFieldNames)),
        ),
      ),
    [groups, visibleFieldNames, values],
  );

  return (
    <>
      <div className="flex flex-col gap-10">
        {step.label && (
          <StepHeader description={step.description ?? ""} title={step.label} />
        )}

        {visibleGroups.map((group, groupIndex) => (
          <GroupSection
            errors={errors}
            group={group}
            isLast={groupIndex === visibleGroups.length - 1}
            jsonSchema={jsonSchema}
            key={group.label ?? groupIndex}
            onChange={handleChange}
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

      <ModalFooter
        cancelLabel="Previous"
        confirmLabel={isLastStep ? "Create Purpose" : "Next"}
        isDisabled={isPending}
        onCancel={prevStep}
        onConfirm={handleNext}
      />
    </>
  );
}

function GroupSection({
  errors,
  group,
  isLast,
  jsonSchema,
  onChange,
  values,
  visibleFieldNames,
}: {
  errors: Record<string, string>;
  group: GroupLayout;
  isLast: boolean;
  jsonSchema: JsonSchema;
  onChange: (fieldName: string, value: string | string[]) => void;
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
      {group.elements.map((element, i) => {
        if (element.type === "Label") {
          if (!isLabelVisible(element, values, visibleFieldNames)) return null;
          return (
            <InfoBanner
              key={`label-${i}`}
              text={element.text}
              variant={element.options?.variant}
            />
          );
        }
        const fieldName = scopeToFieldName(element.scope);
        if (!visibleFieldNames.has(fieldName)) return null;
        return (
          <FieldRenderer
            allValues={values}
            control={element}
            error={errors[fieldName]}
            jsonSchema={jsonSchema}
            key={fieldName}
            onChange={(v) => onChange(fieldName, v)}
            value={
              values[fieldName] ??
              (jsonSchema.properties[fieldName]?.type === "array" ? [] : "")
            }
          />
        );
      })}
      {!isLast && <hr className="border-primary-light-decorative mt-2" />}
    </div>
  );
}
