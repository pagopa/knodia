import type {
  ControlElement,
  FormTexts,
  JsonSchema,
  LabelElement,
  UISchema,
  UISchemaElement,
} from "./types";

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

// Extracts error messages from texts.json, keyed by field name then validation keyword.
export function collectErrorMessages(
  texts: FormTexts,
  schema: JsonSchema,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const fieldName of Object.keys(schema.properties)) {
    const msgs = getFieldErrorMessages(texts, fieldName);
    if (Object.keys(msgs).length > 0) {
      result[fieldName] = msgs;
    }
  }
  return result;
}

// Collects Group elements from the UI Schema for section-based rendering.
// Resolves group label/description from texts.json via textKey, with inline fallback.
export function collectGroups(
  uischema: UISchema,
  texts: FormTexts,
): GroupLayout[] {
  if (uischema.type === "Group") {
    return [
      {
        description:
          getGroupDescription(texts, uischema.textKey) ??
          uischema.options?.description,
        elements: collectGroupElements(uischema),
        label: getGroupLabel(texts, uischema.textKey) ?? uischema.label,
      },
    ];
  }

  // VerticalLayout / HorizontalLayout — check if children are Groups
  const groups: GroupLayout[] = [];
  for (const child of uischema.elements) {
    if (child.type === "Group") {
      groups.push({
        description:
          getGroupDescription(texts, child.textKey) ??
          child.options?.description,
        elements: collectGroupElements(child),
        label: getGroupLabel(texts, child.textKey) ?? child.label,
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
// Resolves step label/description from texts.json via textKey, with inline fallback.
export function collectSteps(
  uischema: UISchema,
  texts: FormTexts,
): StepLayout[] {
  const steps: StepLayout[] = [];
  for (const child of uischema.elements) {
    if (child.type === "Group") {
      steps.push({
        description:
          getGroupDescription(texts, child.textKey) ??
          child.options?.description,
        elements: child.elements,
        label: getGroupLabel(texts, child.textKey) ?? child.label,
      });
    }
  }

  if (steps.length === 0) {
    return [{ elements: uischema.elements }];
  }

  return steps;
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
