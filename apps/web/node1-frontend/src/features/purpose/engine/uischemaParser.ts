import type {
  AndCondition,
  ControlElement,
  FormTexts,
  RuleCondition,
  UISchema,
  UISchemaElement,
} from "./types";

import { scopeToFieldName } from "./scope";
import {
  getFieldErrorMessages,
  getGroupDescription,
  getGroupLabel,
} from "./textsResolver";

export interface GroupLayout {
  description?: string | undefined;
  elements: ControlElement[];
  label?: string | undefined;
}

export interface StepLayout {
  description?: string | undefined;
  elements: UISchemaElement[];
  label?: string | undefined;
}

export function collectConditionScopes(condition: RuleCondition): string[] {
  if (isAndCondition(condition)) {
    return condition.conditions.flatMap(collectConditionScopes);
  }
  return [condition.scope];
}

export function collectControls(element: UISchemaElement): ControlElement[] {
  if (element.type === "Control") {
    return [element];
  }
  if ("elements" in element) {
    return element.elements.flatMap(collectControls);
  }
  return [];
}

export function collectErrorMessages(
  texts: FormTexts,
  uischema: UISchema,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const control of collectControls(uischema)) {
    const fieldName = scopeToFieldName(control.scope);
    const errors = getFieldErrorMessages(texts, fieldName);
    if (Object.keys(errors).length > 0) {
      result[fieldName] = errors;
    }
  }
  return result;
}

export function collectGroups(
  uischema: UISchema,
  texts: FormTexts,
): GroupLayout[] {
  if (uischema.type === "Group") {
    return [
      {
        ...resolveGroupI18n(texts, uischema.i18n),
        elements: collectGroupElements(uischema),
      },
    ];
  }

  const groups = uischema.elements
    .filter((child) => child.type === "Group")
    .map((child) => ({
      ...resolveGroupI18n(texts, child.i18n),
      elements: collectGroupElements(child),
    }));

  if (groups.length === 0) {
    return [{ elements: collectGroupElements(uischema) }];
  }

  return groups;
}

export function collectSteps(
  uischema: UISchema,
  texts: FormTexts,
): StepLayout[] {
  const steps = uischema.elements
    .filter((child) => child.type === "Group")
    .map((child) => ({
      ...resolveGroupI18n(texts, child.i18n),
      elements: child.elements,
    }));

  if (steps.length === 0) {
    return [{ elements: uischema.elements }];
  }

  return steps;
}

export function isAndCondition(c: RuleCondition): c is AndCondition {
  return "type" in c && c.type === "AND";
}

function collectGroupElements(element: UISchemaElement): ControlElement[] {
  if (element.type === "Control") {
    return [element];
  }
  if ("elements" in element) {
    return element.elements.flatMap(collectGroupElements);
  }
  return [];
}

// Returns { label, description } for a Group, falling back to the raw i18n key
// when a text is missing so renders never crash mid-flow.
function resolveGroupI18n(
  texts: FormTexts,
  i18n: string,
): { description: string | undefined; label: string } {
  return {
    description: getGroupDescription(texts, i18n),
    label: getGroupLabel(texts, i18n) ?? i18n,
  };
}
