import type {
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
  if ("type" in condition && condition.type === "AND") {
    return condition.conditions.every((c) => evaluateCondition(c, values));
  }

  const leaf = condition as Exclude<RuleCondition, { type: "AND" }>;
  const fieldName = scopeToFieldName(leaf.scope);
  const value = values[fieldName];

  if ("const" in leaf.schema) {
    if (Array.isArray(value)) {
      return value.includes(leaf.schema.const);
    }
    return value === leaf.schema.const;
  }

  if ("contains" in leaf.schema) {
    if (Array.isArray(value)) {
      return value.includes(leaf.schema.contains.const);
    }
    return value === leaf.schema.contains.const;
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
  if ("type" in condition && condition.type === "AND") {
    return condition.conditions.flatMap(collectScopes);
  }
  const leaf = condition as Exclude<RuleCondition, { type: "AND" }>;
  return [scopeToFieldName(leaf.scope)];
}
