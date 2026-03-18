import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useMemo, useState } from "react";

import type {
  FormValues,
  GroupElement,
  JsonSchema,
  UISchema,
} from "../engine/types";

import { GroupSection } from "../components/GroupSection";
import { StepIndicator } from "../components/StepIndicator";
import { createAjvValidator } from "../engine/ajv/validation";
import {
  getVisibleFields,
  isLabelVisible,
  scopeToFieldName,
} from "../engine/dependencyResolver";
import { getDefaultValues } from "../engine/schemaParser";
import { loadSchema, loadUiSchema } from "../engine/types";
import { collectErrorMessages, collectGroups } from "../engine/uischemaParser";
import { useVisibleFields } from "../hooks/useVisibleFields";
import jsonSchema from "../schemas/two-form/schema.json";
import uischema from "../schemas/two-form/uischema.json";

const schema = loadSchema(jsonSchema);
const ui = loadUiSchema(uischema);

interface StepConfig {
  stepUischema: UISchema;
  submitLabel: string;
  subtitle: string;
  title: string;
}

export function TwoFormTanstackAjvPage() {
  const validate = useMemo(
    () => createAjvValidator(schema, collectErrorMessages(ui)),
    [],
  );
  const steps = useMemo(() => getSteps(ui), []);

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<FormValues | null>(
    null,
  );

  const form = useForm({
    defaultValues: getDefaultValues(schema) as Record<
      string,
      string | string[]
    >,
    onSubmit: ({ value }) => {
      if (currentStep < steps.length - 1) {
        setSubmitted(false);
        setCurrentStep((prev) => prev + 1);
      } else {
        const allVisible = getVisibleFields(ui, value);
        const filtered: FormValues = {};
        for (const [key, val] of Object.entries(value)) {
          if (allVisible.has(key)) {
            filtered[key] = val;
          }
        }
        setSubmittedValues(filtered);
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        setSubmitted(true);
        const fieldErrors = validate(value, stepVisibleFields);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          return "Validation failed";
        }
        setErrors({});
        return undefined;
      },
    },
  });

  const values = useStore(form.store, (state) => state.values);

  const step = steps[currentStep] as StepConfig;
  const { visibleFieldNames } = useVisibleFields(ui, values);

  const stepVisibleFields = useMemo(() => {
    const stepVisible = getVisibleFields(step.stepUischema, values);
    return new Set([...stepVisible].filter((f) => visibleFieldNames.has(f)));
  }, [step.stepUischema, values, visibleFieldNames]);

  const handleChange = useCallback(
    (fieldName: string, newValue: string | string[]) => {
      form.setFieldValue(fieldName, newValue);
      if (submitted) {
        setErrors((prev) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [fieldName]: _removed, ...rest } = prev;
          return rest;
        });
      }
    },
    [form, submitted],
  );

  const formId = `two-form-tanstack-step-${currentStep}`;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-blue-100 flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl text-blue-800">
          Create Purpose (TanStack Form + AJV)
        </h1>
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

            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <TanstackFormStep
                errors={errors}
                jsonSchema={schema}
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

function TanstackFormStep({
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
            (el.type === "Label" && isLabelVisible(el, values)),
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
