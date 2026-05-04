import type { FormValues, JsonSchema, JsonSchemaIfClause } from "./types";

// Evaluates allOf[].if/then/else conditions against current values to compute
// which fields are required at runtime (static `required` + conditional ones).
export function getRequiredFields(
  schema: JsonSchema,
  values: FormValues,
): Set<string> {
  const required = new Set(schema.required ?? []);

  for (const conditional of schema.allOf ?? []) {
    const matches = evaluateIfCondition(conditional.if, values);

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

// Evaluates an `if` clause following JSON Schema semantics. The UI engine
// uses this to decide which fields to mark as required, and the JSON Schema
// validator (AJV) runs the same logic at submit time — they must agree.
//
// Two rules from the JSON Schema spec that matter here:
//
// 1. `required` lists fields that MUST exist in the instance. If any are
//    missing, the subschema fails. So if `if.required` lists a field that
//    is missing from the values, the `if` is considered NOT satisfied
//    (and `else` fires).
//
// 2. `properties` only constrains keys that are actually present in the
//    instance. If a field appears in `if.properties` but is missing from
//    the values, the constraint on it is IGNORED — the `if` can still
//    match on whatever else is there.
//
// Example A — `if` without `required`, `foo` missing from values:
//   if:   { properties: { foo: { const: "BAR" } } }
//   then: { required: ["baz"] }
//   values: {}
//   → `foo` is missing, the `properties` constraint on it is ignored, the
//     `if` has nothing left to check and matches, `then` fires, `baz` is
//     required.
//
// Example B — `if` with `required`, `foo` missing from values:
//   if:   { properties: { foo: { const: "BAR" } }, required: ["foo"] }
//   then: { required: ["baz"] }
//   values: {}
//   → `foo` is missing but listed in `if.required`, so the `if` fails
//     immediately, `else` fires (or nothing, if there is no else), `baz`
//     is not required.
//
// Without these rules, the UI engine and the JSON Schema validator can
// disagree on the same schema in the same browser tab — the user fills in
// everything the UI marks as required, hits submit, and validation rejects
// the form complaining about a different field.
function evaluateIfCondition(
  ifClause: JsonSchemaIfClause,
  values: FormValues,
): boolean {
  for (const field of ifClause.required ?? []) {
    if (values[field] === undefined) return false;
  }

  for (const [field, constraint] of Object.entries(ifClause.properties ?? {})) {
    const value = values[field];
    if (value === undefined) continue;

    if (constraint.type === "array" && !Array.isArray(value)) return false;
    if (constraint.type === "string" && typeof value !== "string") return false;

    if ("const" in constraint && constraint.const !== undefined) {
      if (value !== constraint.const) return false;
    }

    if ("contains" in constraint && constraint.contains !== undefined) {
      if (!Array.isArray(value) || !value.includes(constraint.contains.const)) {
        return false;
      }
    }
  }

  return true;
}
