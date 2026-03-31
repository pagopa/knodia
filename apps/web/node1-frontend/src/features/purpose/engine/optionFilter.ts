import type { ControlElement, FormValues } from "./types";

import { evaluateCondition } from "./dependencyResolver";

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
