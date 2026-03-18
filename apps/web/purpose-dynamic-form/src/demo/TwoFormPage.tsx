import { useCallback, useMemo, useState } from "react";

import type {
  FormValues,
  GroupElement,
  JsonSchema,
  UISchema,
  ValidateFn,
} from "../engine/types";

import { GroupSection } from "../components/GroupSection";
import { StepIndicator } from "../components/StepIndicator";
import {
  getVisibleFields,
  isLabelVisible,
  scopeToFieldName,
} from "../engine/dependencyResolver";
import { getDefaultValues } from "../engine/schemaParser";
import { collectGroups } from "../engine/uischemaParser";
import { useVisibleFields } from "../hooks/useVisibleFields";

interface Props {
  jsonSchema: JsonSchema;
  title: string;
  uischema: UISchema;
  validate: ValidateFn;
}

interface StepConfig {
  stepUischema: UISchema;
  submitLabel: string;
  subtitle: string;
  title: string;
}

export function TwoFormPage({ jsonSchema, title, uischema, validate }: Props) {
  const steps = useMemo(() => getSteps(uischema), [uischema]);

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(() =>
    getDefaultValues(jsonSchema),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(
    null,
  );

  const step = steps[currentStep] as StepConfig;
  const { visibleFieldNames } = useVisibleFields(uischema, values);

  const stepVisibleFields = useMemo(() => {
    const stepVisible = getVisibleFields(step.stepUischema, values);
    return new Set([...stepVisible].filter((f) => visibleFieldNames.has(f)));
  }, [step.stepUischema, values, visibleFieldNames]);

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
        const allVisible = getVisibleFields(uischema, values);
        const filtered: FormValues = {};
        for (const [key, val] of Object.entries(values)) {
          if (allVisible.has(key)) {
            filtered[key] = val;
          }
        }
        setSubmittedValues(filtered);
      }
    },
    [runValidation, currentStep, steps.length, uischema, values],
  );

  const formId = `two-form-step-${currentStep}`;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-blue-100 flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl text-blue-800">{title}</h1>
      </div>

      <div className="flex justify-center flex-1">
        <div className="flex flex-col gap-16 max-w-160 w-full px-10 pt-10 pb-16">
          <StepIndicator currentStep={currentStep} totalSteps={steps.length} />

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <h2 className="text-[32px] font-semibold leading-[1.2] text-slate-700">
                {step.title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-700">
                {step.subtitle}
              </p>
            </div>

            <form id={formId} onSubmit={handleSubmit}>
              <FormStep
                errors={errors}
                jsonSchema={jsonSchema}
                onChange={handleChange}
                stepUischema={step.stepUischema}
                values={values}
                visibleFieldNames={visibleFieldNames}
              />
            </form>
          </div>

          <div className="flex gap-4 justify-end">
            {currentStep > 0 && (
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => {
                  setErrors({});
                  setSubmitted(false);
                  setCurrentStep((prev) => prev - 1);
                }}
                type="button"
              >
                Previous
              </button>
            )}
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800"
              form={formId}
              type="submit"
            >
              {step.submitLabel}
            </button>
          </div>
        </div>
      </div>

      {submittedValues && (
        <div className="max-w-160 w-full mx-auto px-10 pb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Submitted Values
            </h2>
            <pre className="bg-gray-50 rounded-md p-4 text-xs overflow-auto max-h-96">
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

function getSteps(uischema: UISchema): StepConfig[] {
  const topGroups = uischema.elements.filter(
    (el): el is GroupElement => el.type === "Group",
  );

  return topGroups.map((group, i) => ({
    stepUischema: { elements: group.elements, type: "VerticalLayout" as const },
    submitLabel: i < topGroups.length - 1 ? "Next" : "Create Purpose",
    subtitle: group.options?.description ?? "",
    title: group.label ?? "",
  }));
}
