import type { FormValues, JsonSchema } from "./types";

// Evaluates allOf[].if/then/else conditions against current values to compute
// which fields are required at runtime (static `required` + conditional ones).
export function getRequiredFields(
  schema: JsonSchema,
  values: FormValues,
): Set<string> {
  const required = new Set(schema.required ?? []);

  for (const conditional of schema.allOf ?? []) {
    const matches = evaluateIfCondition(conditional.if.properties, values);

    if (matches && conditional.then.required) {
      for (const field of conditional.then.required) {
        required.add(field);
      }
    }

    if (!matches && conditional.else?.required) {
      for (const field of conditional.else.required) {
        required.add(field);
      }
    }
  }

  return required;
}

function evaluateIfCondition(
  ifProps: Record<string, { const?: string; contains?: { const: string } }>,
  values: FormValues,
): boolean {
  for (const [field, constraint] of Object.entries(ifProps)) {
    const value = values[field];

    if ("const" in constraint && constraint.const !== undefined) {
      if (
        Array.isArray(value)
          ? !value.includes(constraint.const)
          : value !== constraint.const
      ) {
        return false;
      }
    }

    if ("contains" in constraint && constraint.contains !== undefined) {
      if (!Array.isArray(value) || !value.includes(constraint.contains.const)) {
        return false;
      }
    }
  }

  return true;
}
