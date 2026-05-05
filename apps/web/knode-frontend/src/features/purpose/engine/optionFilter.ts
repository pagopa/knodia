import type { ControlElement, FormValues, UISchema } from "./types";

import { evaluateCondition } from "./dependencyResolver";
import { scopeToFieldName } from "./scope";
import { collectControls } from "./uischemaParser";

export function buildControlsByField(
  uischema: UISchema | undefined,
): Record<string, ControlElement> {
  if (!uischema) return {};
  return Object.fromEntries(
    collectControls(uischema).map((c) => [scopeToFieldName(c.scope), c]),
  );
}

export function getFilteredOptionValues(
  control: ControlElement,
  values: FormValues,
): null | Set<string> {
  const hideOptions = control.options?.hideOptions;
  if (!hideOptions) return null;

  const hidden = new Set<string>();

  for (const [optionValue, condition] of Object.entries(hideOptions)) {
    const { schema } = condition;
    const ruleCondition =
      schema.const !== undefined
        ? { schema: { const: schema.const }, scope: condition.scope }
        : schema.contains !== undefined
          ? { schema: { contains: schema.contains }, scope: condition.scope }
          : null;

    if (ruleCondition && evaluateCondition(ruleCondition, values)) {
      hidden.add(optionValue);
    }
  }

  return hidden.size > 0 ? hidden : null;
}

export function stripHiddenOptionValues(
  value: string | string[],
  control: ControlElement | undefined,
  allValues: FormValues,
): string | string[] | undefined {
  if (!control?.options?.hideOptions) return value;
  const hidden = getFilteredOptionValues(control, allValues);
  if (!hidden) return value;
  if (Array.isArray(value)) return value.filter((v) => !hidden.has(v));
  return hidden.has(value) ? undefined : value;
}

export function stripHiddenOptionValuesFromAnswers(
  answers: FormValues,
  uischema: UISchema,
): FormValues {
  const controlsByField = buildControlsByField(uischema);
  const result: FormValues = {};
  for (const [field, val] of Object.entries(answers)) {
    if (val === undefined) continue;
    const cleaned = stripHiddenOptionValues(
      val,
      controlsByField[field],
      answers,
    );
    if (cleaned !== undefined) result[field] = cleaned;
  }
  return result;
}
