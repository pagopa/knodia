import type {
  ControlElement,
  LabelElement,
  UISchema,
  UISchemaElement,
} from "./types";

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

// Extracts custom error messages (options.errorMessages) from each control,
// keyed by field name then validation keyword (e.g. "required", "minLength").
export function collectErrorMessages(
  uischema: UISchema,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const control of collectControls(uischema)) {
    if (control.options?.errorMessages) {
      const fieldName = control.scope.replace("#/properties/", "");
      result[fieldName] = control.options.errorMessages;
    }
  }
  return result;
}

// Collects Group elements from the UI Schema for section-based rendering.
// If the schema has no explicit groups, wraps all elements in a single implicit group.
export function collectGroups(uischema: UISchema): GroupLayout[] {
  if (uischema.type === "Group") {
    return [
      {
        description: uischema.options?.description,
        elements: collectGroupElements(uischema),
        label: uischema.label,
      },
    ];
  }

  // VerticalLayout / HorizontalLayout — check if children are Groups
  const groups: GroupLayout[] = [];
  for (const child of uischema.elements) {
    if (child.type === "Group") {
      groups.push({
        description: child.options?.description,
        elements: collectGroupElements(child),
        label: child.label,
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
// If no top-level Groups exist, wraps all elements in a single implicit step.
export function collectSteps(uischema: UISchema): StepLayout[] {
  const steps: StepLayout[] = [];
  for (const child of uischema.elements) {
    if (child.type === "Group") {
      steps.push({
        description: child.options?.description,
        elements: child.elements,
        label: child.label,
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
