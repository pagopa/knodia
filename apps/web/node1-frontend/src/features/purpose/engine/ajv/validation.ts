import Ajv from "ajv/dist/2020";

import type {
  FormValues,
  JsonSchema,
  JsonSchemaProperty,
  ValidateFn,
} from "../types";

import { getRequiredFields } from "../requiredFields";

export function createAjvValidator(
  jsonSchema: JsonSchema,
  errorMessages: Record<string, Record<string, string>>,
): ValidateFn {
  const ajv = new Ajv({ allErrors: true });
  return (values, visibleFields) => {
    const subsetSchema = buildSubsetSchema(jsonSchema, visibleFields, values);
    const validateFn = ajv.compile(subsetSchema);

    const visibleValues: FormValues = {};
    for (const field of visibleFields) {
      const val = values[field];
      if (val !== undefined) visibleValues[field] = val;
    }

    if (validateFn(visibleValues)) return {};
    return ajvErrorsToFieldErrors(validateFn.errors, errorMessages);
  };
}

function addInstancePathError(
  fieldErrors: Record<string, string>,
  err: {
    instancePath: string;
    keyword: string;
    message?: string;
    params?: Record<string, unknown>;
  },
  errorMessages?: Record<string, Record<string, string>>,
): void {
  const field = err.instancePath.slice(1);
  if (field && !fieldErrors[field]) {
    const isRequiredProxy =
      (err.keyword === "minLength" || err.keyword === "minItems") &&
      err.params?.["limit"] === 1;
    const customMsg = isRequiredProxy
      ? errorMessages?.[field]?.["required"]
      : errorMessages?.[field]?.[err.keyword];
    fieldErrors[field] = customMsg ?? err.message ?? "Invalid value";
  }
}

function addRequiredError(
  fieldErrors: Record<string, string>,
  err: { params: Record<string, unknown> },
  errorMessages?: Record<string, Record<string, string>>,
): void {
  const field = err.params["missingProperty"] as string;
  if (field && !fieldErrors[field]) {
    fieldErrors[field] =
      errorMessages?.[field]?.["required"] ?? "This field is required";
  }
}

function ajvErrorsToFieldErrors(
  errors: InstanceType<typeof Ajv>["errors"],
  errorMessages?: Record<string, Record<string, string>>,
): Record<string, string> {
  if (!errors) return {};

  const fieldErrors: Record<string, string> = {};

  for (const err of errors) {
    if (err.keyword === "required") {
      addRequiredError(fieldErrors, err, errorMessages);
    } else if (err.instancePath) {
      addInstancePathError(fieldErrors, err, errorMessages);
    }
  }

  return fieldErrors;
}

// Builds a subset JSON Schema for the current step's visible fields only.
// Drops allOf conditions whose required fields are outside this step.
function buildSubsetSchema(
  jsonSchema: JsonSchema,
  visibleFields: Set<string>,
  values?: FormValues,
): Record<string, unknown> {
  const allRequired = getRequiredFields(jsonSchema, values ?? {});
  const requiredSet = new Set(
    [...allRequired].filter((f) => visibleFields.has(f)),
  );

  const properties: Record<string, unknown> = {};
  for (const field of visibleFields) {
    const prop = jsonSchema.properties[field];
    if (!prop) continue;
    properties[field] = requiredSet.has(field) ? patchPropNonEmpty(prop) : prop;
  }

  const allOf = (jsonSchema.allOf ?? [])
    .filter((cond) => {
      const thenFields = cond.then.required ?? [];
      const elseFields = cond.else?.required ?? [];
      return (
        thenFields.every((f) => visibleFields.has(f)) &&
        elseFields.every((f) => visibleFields.has(f))
      );
    })
    .map((cond) => ({
      ...cond,
      if: {
        ...cond.if,
        properties: Object.fromEntries(
          Object.entries(cond.if.properties).filter(([key]) =>
            visibleFields.has(key),
          ),
        ),
      },
    }))
    .filter((cond) => Object.keys(cond.if.properties).length > 0);

  return {
    properties,
    type: "object",
    ...(requiredSet.size > 0 && { required: [...requiredSet] }),
    ...(allOf.length > 0 && { allOf }),
  };
}

// JSON Schema `required` only checks that a property key exists in the object —
// it does NOT reject empty strings ("") or empty arrays ([]).
// Since our form initializes fields with these empty defaults, a required field
// would pass AJV validation even when the user hasn't filled it in.
// This function patches required properties so AJV enforces non-empty values:
// strings get minLength: 1, arrays get minItems: 1.
function patchPropNonEmpty(prop: JsonSchemaProperty): JsonSchemaProperty {
  if (prop.type === "array")
    return { ...prop, minItems: Math.max(1, prop.minItems ?? 0) };
  if (prop.type === "string" && prop.const === undefined)
    return { ...prop, minLength: Math.max(1, prop.minLength ?? 0) };
  return prop;
}
