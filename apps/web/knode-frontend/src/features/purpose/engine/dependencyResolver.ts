import type { FormValues, RuleCondition, UISchema } from "./types";

import { scopeToFieldName } from "./scope";
import { collectControls, isAndCondition } from "./uischemaParser";

export function evaluateCondition(
  condition: RuleCondition,
  values: FormValues,
): boolean {
  if (isAndCondition(condition)) {
    return condition.conditions.every((c) => evaluateCondition(c, values));
  }

  const fieldName = scopeToFieldName(condition.scope);
  const value = values[fieldName];

  // JSON Forms UI rules treat `const` as "value is or contains this" — NOT
  // strict equality like JSON Schema. This is intentional and differs from
  // evaluateIfCondition in requiredFields.ts, which follows JSON Schema
  // semantics (strict equality) because it must agree with the AJV validator.
  if ("const" in condition.schema) {
    if (Array.isArray(value)) {
      return value.includes(condition.schema.const);
    }
    return value === condition.schema.const;
  }

  if ("contains" in condition.schema) {
    if (Array.isArray(value)) {
      return value.includes(condition.schema.contains.const);
    }
    return value === condition.schema.contains.const;
  }

  return false;
}

export function getVisibleFields(
  uischema: UISchema,
  values: FormValues,
): Set<string> {
  const controls = collectControls(uischema);
  const visible = new Set<string>();

  for (const control of controls) {
    const fieldName = scopeToFieldName(control.scope);
    if (!control.rule) {
      visible.add(fieldName);
      continue;
    }

    const conditionMet = evaluateCondition(control.rule.condition, values);
    const isVisible =
      control.rule.effect === "SHOW" ? conditionMet : !conditionMet;

    if (isVisible) {
      visible.add(fieldName);
    }
  }

  return visible;
}
