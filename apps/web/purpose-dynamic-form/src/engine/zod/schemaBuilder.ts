import { z, type ZodType } from "zod";

import type { FormValues, JsonSchema, ValidateFn } from "../types";

import { getRequiredFields } from "../requiredFields";

// Builds a Zod schema for the current step's visible fields only.
// Unlike AJV (which needs the JSON Schema filtered down), Zod schemas are
// constructed from scratch so we just iterate over visibleFields directly.
export function buildZodSchema(
  jsonSchema: JsonSchema,
  visibleFields: Set<string>,
  values: FormValues,
  errorMessages?: Record<string, Record<string, string>>,
): z.ZodObject<Record<string, ZodType>> {
  const requiredFields = getRequiredFields(jsonSchema, values);
  const shape: Record<string, ZodType> = {};

  for (const fieldName of visibleFields) {
    const prop = jsonSchema.properties[fieldName];
    if (!prop) continue;

    const isRequired = requiredFields.has(fieldName);
    const msg = errorMessages?.[fieldName];

    if (prop.type === "string") {
      shape[fieldName] = buildStringField(prop, isRequired, msg);
    } else if (prop.type === "array" && prop.items) {
      shape[fieldName] = buildArrayField(prop, isRequired, msg);
    }
  }

  return z.object(shape);
}

export function createZodValidator(
  jsonSchema: JsonSchema,
  errorMessages: Record<string, Record<string, string>>,
): ValidateFn {
  return (values, visibleFields) => {
    const zodSchema = buildZodSchema(
      jsonSchema,
      visibleFields,
      values,
      errorMessages,
    );
    const result = zodSchema.safeParse(values);
    if (result.success) return {};

    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return fieldErrors;
  };
}

function buildArrayField(
  prop: JsonSchema["properties"][string],
  isRequired: boolean,
  msg?: Record<string, string>,
): ZodType {
  const itemSchema = prop.items?.enum
    ? z.enum(prop.items.enum as [string, ...string[]])
    : z.string();

  let schema = z.array(itemSchema);
  if (isRequired) {
    schema = schema.min(1, msg?.["required"]);
  }
  if (prop.minItems !== undefined && prop.minItems > 1) {
    schema = schema.min(prop.minItems, msg?.["minItems"]);
  }
  return isRequired ? schema : schema.optional();
}

function buildStringField(
  prop: JsonSchema["properties"][string],
  isRequired: boolean,
  msg?: Record<string, string>,
): ZodType {
  if (prop.const !== undefined) {
    return z.literal(prop.const);
  }

  let schema = z.string();
  if (isRequired) {
    schema = schema.min(1, msg?.["required"]);
  }
  if (prop.minLength !== undefined && prop.minLength > 1) {
    schema = schema.min(prop.minLength, msg?.["minLength"]);
  }
  if (prop.maxLength !== undefined) {
    schema = schema.max(prop.maxLength, msg?.["maxLength"]);
  }
  return isRequired ? schema : schema.optional();
}
