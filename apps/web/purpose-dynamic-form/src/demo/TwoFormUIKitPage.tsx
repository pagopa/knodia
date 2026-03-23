import { Button, Steps } from "@knodia/ui-kit/ui";
import { useCallback, useMemo, useState } from "react";

import type { FormValues, JsonSchema, UISchema } from "../engine/types";
import type { GroupLayout, StepLayout } from "../engine/uischemaParser";

import {
  getVisibleFields,
  isLabelVisible,
  scopeToFieldName,
} from "../engine/dependencyResolver";
import { getDefaultValues } from "../engine/schemaParser";
import { loadSchema, loadUiSchema } from "../engine/types";
import {
  collectErrorMessages,
  collectGroups,
  collectSteps,
} from "../engine/uischemaParser";
import { createZodValidator } from "../engine/zod/schemaBuilder";
import { useVisibleFields } from "../hooks/useVisibleFields";
import { FieldRenderer } from "../renderers/uikit/FieldRenderer";
import { InfoBanner } from "../renderers/uikit/InfoBanner";
import jsonSchemaData from "../schemas/two-form/schema.json";
import uischemaData from "../schemas/two-form/uischema.json";

const schema = loadSchema(jsonSchemaData);
const ui = loadUiSchema(uischemaData);

export function TwoFormUIKitPage() {
  const validate = useMemo(
    () => createZodValidator(schema, collectErrorMessages(ui)),
    [],
  );

  const steps = useMemo(() => collectSteps(ui), []);
  const stepLabels = useMemo(() => steps.map((s) => s.label ?? ""), [steps]);
  const isMultiStep = steps.length > 1;

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(() =>
    getDefaultValues(schema),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(
    null,
  );

  const step = steps[currentStep] as StepLayout;
  const stepUischema: UISchema = useMemo(
    () => ({ elements: step.elements, type: "VerticalLayout" as const }),
    [step.elements],
  );
  const { visibleFieldNames } = useVisibleFields(ui, values);

  const stepVisibleFields = useMemo(() => {
    const stepVisible = getVisibleFields(stepUischema, values);
    return new Set([...stepVisible].filter((f) => visibleFieldNames.has(f)));
  }, [stepUischema, values, visibleFieldNames]);

  const handleChange = useCallback(
    (fieldName: string, newValue: string | string[]) => {
      setValues((prev) => ({ ...prev, [fieldName]: newValue }));
      if (submitted) {
        setErrors((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [fieldName]: _removed, ...rest } = prev;
          return rest;
        });
      }
    },
    [submitted],
  );

  const runValidation = useCallback(() => {
    setSubmitted(true);
    const fieldErrors = validate(values, stepVisibleFields);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [validate, values, stepVisibleFields]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!runValidation()) return;

      if (currentStep < steps.length - 1) {
        setSubmitted(false);
        setCurrentStep((prev) => prev + 1);
      } else {
        const allVisible = getVisibleFields(ui, values);
        const filtered: FormValues = {};
        for (const [key, val] of Object.entries(values)) {
          if (allVisible.has(key)) {
            filtered[key] = val;
          }
        }
        setSubmittedValues(filtered);
      }
    },
    [runValidation, currentStep, steps.length, values],
  );

  const formId = `uikit-form-step-${currentStep}`;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-brand-100 flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl text-brand-800">Create Purpose (UI Kit)</h1>
      </div>

      <div className="flex justify-center flex-1">
        <div className="flex flex-col gap-16 max-w-160 w-full px-10 pt-10 pb-16">
          {isMultiStep && (
            <Steps
              ariaLabel="Form progress"
              current={currentStep}
              steps={stepLabels}
            />
          )}

          <div className="flex flex-col gap-10">
            {step.label && (
              <div className="flex flex-col gap-3">
                <h2 className="text-[32px] font-semibold leading-[1.2] text-primary-light-high-contrast">
                  {step.label}
                </h2>
                {step.description && (
                  <p className="body-md text-primary-light-mid-contrast">
                    {step.description}
                  </p>
                )}
              </div>
            )}

            <form id={formId} onSubmit={handleSubmit}>
              <FormStep
                errors={errors}
                jsonSchema={schema}
                onChange={handleChange}
                stepUischema={stepUischema}
                values={values}
                visibleFieldNames={visibleFieldNames}
              />
            </form>
          </div>

          <div className="flex gap-4 justify-end">
            {currentStep > 0 && (
              <Button
                hierarchy="neutral"
                kind="outlined"
                onPress={() => {
                  setErrors({});
                  setSubmitted(false);
                  setCurrentStep((prev) => prev - 1);
                }}
              >
                Previous
              </Button>
            )}
            <button form={formId} hidden type="submit" />
            <Button
              onPress={() => {
                const form = document.getElementById(formId) as HTMLFormElement;
                form?.requestSubmit();
              }}
            >
              {currentStep < steps.length - 1 ? "Next" : "Create Purpose"}
            </Button>
          </div>
        </div>
      </div>

      {submittedValues && (
        <div className="max-w-160 w-full mx-auto px-10 pb-16">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-light-low-contrast p-6">
            <h2 className="title-md text-primary-light-high-contrast mb-3">
              Submitted Values
            </h2>
            <pre className="bg-secondary-light rounded-md p-4 text-xs overflow-auto max-h-96">
              {JSON.stringify(submittedValues, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function FormStep({
  errors,
  jsonSchema,
  onChange,
  stepUischema,
  values,
  visibleFieldNames,
}: {
  errors: Record<string, string>;
  jsonSchema: JsonSchema;
  onChange: (fieldName: string, value: string | string[]) => void;
  stepUischema: UISchema;
  values: FormValues;
  visibleFieldNames: Set<string>;
}) {
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
      {visibleGroups.map((group, groupIndex) => (
        <GroupSection
          errors={errors}
          group={group}
          isLast={groupIndex === visibleGroups.length - 1}
          jsonSchema={jsonSchema}
          key={group.label ?? groupIndex}
          onChange={onChange}
          values={values}
          visibleFieldNames={visibleFieldNames}
        />
      ))}
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
    <div className="flex flex-col gap-6 py-6 first:pt-0">
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
          return <InfoBanner key={`label-${i}`} text={element.text} />;
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
      {!isLast && <hr className="border-secondary-light-low-contrast" />}
    </div>
  );
}
