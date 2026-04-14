import type { ControlElement, FormValues, UISchema } from "./types";

import { evaluateCondition, scopeToFieldName } from "./dependencyResolver";
import { collectControls } from "./uischemaParser";

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

export function stripHiddenAnswers(
  answers: FormValues,
  uischema: UISchema,
): FormValues {
  const controlsByField: Record<string, ControlElement> = Object.fromEntries(
    collectControls(uischema).map((c) => [scopeToFieldName(c.scope), c]),
  );
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
