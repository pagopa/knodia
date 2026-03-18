import type {
  AndCondition,
  FormValues,
  LabelElement,
  RuleCondition,
  UISchema,
} from "./types";

import { collectControls } from "./uischemaParser";

export function evaluateCondition(
  condition: RuleCondition,
  values: FormValues,
): boolean {
  if (isAndCondition(condition)) {
    return condition.conditions.every((c) => evaluateCondition(c, values));
  }

  const fieldName = scopeToFieldName(condition.scope);
  const value = values[fieldName];

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

export function isLabelVisible(
  label: LabelElement,
  allValues: FormValues,
  visibleFieldNames: Set<string>,
): boolean {
  if (!label.rule) return true;
  const scopes = collectScopes(label.rule.condition);
  if (scopes.some((s) => !visibleFieldNames.has(s))) return false;
  const conditionMet = evaluateCondition(label.rule.condition, allValues);
  return label.rule.effect === "SHOW" ? conditionMet : !conditionMet;
}

export function scopeToFieldName(scope: string): string {
  return scope.replace("#/properties/", "");
}

function collectScopes(condition: RuleCondition): string[] {
  if (isAndCondition(condition)) {
    return condition.conditions.flatMap(collectScopes);
  }
  return [scopeToFieldName(condition.scope)];
}

function isAndCondition(c: RuleCondition): c is AndCondition {
  return "type" in c && c.type === "AND";
}
