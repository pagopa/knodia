import type {
  AndCondition,
  ControlElement,
  FormTexts,
  LabelElement,
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
  elements: (ControlElement | LabelElement)[];
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

// Recursively flattens the UI Schema tree into a list of Control elements.
export function collectControls(element: UISchemaElement): ControlElement[] {
  if (element.type === "Control") {
    return [element];
  }
  if ("elements" in element) {
    return element.elements.flatMap(collectControls);
  }
  return [];
}

// Extracts custom error messages from texts, keyed by field name.
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

// Collects Group elements from the UI Schema for section-based rendering.
// Resolves group label/description from texts via i18n; falls back to the
// i18n key itself if the text is missing.
export function collectGroups(
  uischema: UISchema,
  texts: FormTexts,
): GroupLayout[] {
  if (uischema.type === "Group") {
    return [
      {
        description: getGroupDescription(texts, uischema.i18n),
        elements: collectGroupElements(uischema),
        label: getGroupLabel(texts, uischema.i18n) ?? uischema.i18n,
      },
    ];
  }

  // VerticalLayout / HorizontalLayout — check if children are Groups
  const groups: GroupLayout[] = [];
  for (const child of uischema.elements) {
    if (child.type === "Group") {
      groups.push({
        description: getGroupDescription(texts, child.i18n),
        elements: collectGroupElements(child),
        label: getGroupLabel(texts, child.i18n) ?? child.i18n,
      });
    }
  }

  // If no groups found, wrap everything in a single implicit group
  if (groups.length === 0) {
    return [{ elements: collectGroupElements(uischema) }];
  }

  return groups;
}

// Extracts step layouts from the UI Schema for multi-step form rendering.
// Resolves step label/description from texts via i18n; falls back to the
// i18n key itself if the text is missing.
export function collectSteps(
  uischema: UISchema,
  texts: FormTexts,
): StepLayout[] {
  const steps: StepLayout[] = [];
  for (const child of uischema.elements) {
    if (child.type === "Group") {
      steps.push({
        description: getGroupDescription(texts, child.i18n),
        elements: child.elements,
        label: getGroupLabel(texts, child.i18n) ?? child.i18n,
      });
    }
  }

  if (steps.length === 0) {
    return [{ elements: uischema.elements }];
  }

  return steps;
}

export function isAndCondition(c: RuleCondition): c is AndCondition {
  return "type" in c && c.type === "AND";
}

function collectGroupElements(
  element: UISchemaElement,
): (ControlElement | LabelElement)[] {
  if (element.type === "Control" || element.type === "Label") {
    return [element];
  }
  if ("elements" in element) {
    return element.elements.flatMap(collectGroupElements);
  }
  return [];
}
