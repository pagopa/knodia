import type { ValidationMode } from "@jsonforms/core";

import { JsonForms } from "@jsonforms/react";
import { vanillaCells, vanillaRenderers } from "@jsonforms/vanilla-renderers";
import { type ErrorObject } from "ajv";
import { useMemo, useState } from "react";
import "@jsonforms/vanilla-renderers/example/example.css";

import "../renderers/jsonforms/jsonforms.css";
import { StepIndicator } from "../components/StepIndicator";
import { injectNonEmptyConstraints } from "../engine/ajv/validation";
import { loadSchema } from "../engine/types";
import { customRenderers } from "../renderers/jsonforms";
import rawJsonSchema from "../schemas/two-form/schema.json";
import uischema from "../schemas/two-form/uischema.json";

// Strip $schema so JSON Forms' internal AJV (Draft 7) doesn't choke on the 2020-12 meta-schema ref.
// Inject minItems/minLength for required fields so AJV rejects empty values (same as the custom engine).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { $schema, ...baseSchema } = rawJsonSchema;

const jsonSchema = injectNonEmptyConstraints(loadSchema(baseSchema));

// Arrays must be initialized so AJV's `contains` rule evaluation works (undefined passes, [] doesn't).
// Strings are only initialized when they have an explicit default -- omitting them lets `required` work.
const initialData: Record<string, unknown> = {};
for (const [name, prop] of Object.entries(rawJsonSchema.properties)) {
  if (prop.type === "array") {
    initialData[name] = "default" in prop ? prop.default : [];
  } else if ("default" in prop) {
    initialData[name] = prop.default;
  }
}

const renderers = [...vanillaRenderers, ...customRenderers];

interface StepConfig {
  stepUischema: { elements: UISchemaElement[]; type: "VerticalLayout" };
  submitLabel: string;
  subtitle: string;
  title: string;
}

interface UISchemaElement {
  elements?: UISchemaElement[];
  label?: string;
  options?: Record<string, unknown>;
  scope?: string;
  type: string;
}

export function TwoFormJsonFormsPage() {
  const steps = useMemo(() => getSteps(uischema), []);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [allErrors, setAllErrors] = useState<ErrorObject[]>([]);
  const [validationMode, setValidationMode] =
    useState<ValidationMode>("ValidateAndHide");
  const [submittedValues, setSubmittedValues] = useState<null | Record<
    string,
    unknown
  >>(null);

  const step = steps[currentStep] as StepConfig;

  const stepFields = useMemo(
    () => collectScopes(step.stepUischema),
    [step.stepUischema],
  );

  const handleChange = ({
    data: newData,
    errors,
  }: {
    data: unknown;
    errors?: ErrorObject[];
  }) => {
    setData(newData as Record<string, unknown>);
    setAllErrors(errors ?? []);
  };

  const handleNext = () => {
    setValidationMode("ValidateAndShow");
    const stepErrors = getStepErrors(allErrors, stepFields);
    if (stepErrors.length > 0) return;

    if (currentStep < steps.length - 1) {
      setValidationMode("ValidateAndHide");
      setCurrentStep((prev) => prev + 1);
    } else {
      setSubmittedValues(data);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="bg-blue-100 flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl text-blue-800">Create Purpose (JSON Forms)</h1>
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

            <JsonForms
              cells={vanillaCells}
              data={data}
              onChange={handleChange}
              renderers={renderers}
              schema={jsonSchema}
              uischema={step.stepUischema}
              validationMode={validationMode}
            />
          </div>

          <div className="flex gap-4 justify-end">
            {currentStep > 0 && (
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={() => {
                  setValidationMode("ValidateAndHide");
                  setCurrentStep((prev) => prev - 1);
                }}
                type="button"
              >
                Previous
              </button>
            )}
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800"
              onClick={handleNext}
              type="button"
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

function collectScopes(element: UISchemaElement): Set<string> {
  const scopes = new Set<string>();
  if (element.scope) {
    const fieldName = element.scope.replace("#/properties/", "");
    scopes.add(fieldName);
  }
  if (element.elements) {
    for (const child of element.elements) {
      for (const scope of collectScopes(child)) {
        scopes.add(scope);
      }
    }
  }
  return scopes;
}

function getStepErrors(
  errors: ErrorObject[] | undefined,
  stepFields: Set<string>,
): ErrorObject[] {
  if (!errors) return [];
  return errors.filter((e) => {
    const field = e.instancePath.replace("/", "");
    if (stepFields.has(field)) return true;
    // allOf conditional required errors have instancePath "" and params.missingProperty
    if (
      e.instancePath === "" &&
      e.keyword === "required" &&
      e.params &&
      "missingProperty" in e.params &&
      stepFields.has(e.params["missingProperty"] as string)
    )
      return true;
    return false;
  });
}

function getSteps(uischema: { elements: UISchemaElement[] }): StepConfig[] {
  const topGroups = uischema.elements.filter((el) => el.type === "Group");

  return topGroups.map((group, i) => ({
    stepUischema: {
      elements: group.elements ?? [],
      type: "VerticalLayout" as const,
    },
    submitLabel: i < topGroups.length - 1 ? "Next" : "Create Purpose",
    subtitle: (group.options?.["description"] as string) ?? "",
    title: group.label ?? "",
  }));
}
