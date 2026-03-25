import type { FormTexts } from "./types";

import {
  getBannerText,
  getFieldDescription,
  getFieldErrorMessages,
  getFieldLabel,
  getFieldOptionLabels,
  getGroupDescription,
  getGroupLabel,
} from "./textsResolver";

interface AnyElement {
  elements?: AnyElement[];
  label?: string;
  options?: Record<string, unknown>;
  scope?: string;
  text?: string;
  textKey?: string;
  type: string;
}

// Re-injects text from a flat texts.json into a stripped uischema tree.
// Produces a new object suitable for libraries (e.g. JSON Forms) that
// expect labels, optionLabels, and errorMessages inline in the uischema.
export function hydrateUiSchema<T>(uischema: T, texts: FormTexts): T {
  return hydrateElement(uischema as unknown as AnyElement, texts) as T;
}

function hydrateControl(result: AnyElement, texts: FormTexts): AnyElement {
  const fieldName = (result.scope as string).replace("#/properties/", "");
  const label = getFieldLabel(texts, fieldName);
  const description = getFieldDescription(texts, fieldName);
  const optionLabels = getFieldOptionLabels(texts, fieldName);
  const errorMessages = getFieldErrorMessages(texts, fieldName);

  if (label && !result.label) result.label = label;

  const opts = { ...(result.options ?? {}) };
  if (description && !opts["infoLabel"]) opts["infoLabel"] = description;
  if (Object.keys(optionLabels).length > 0 && !opts["optionLabels"]) {
    opts["optionLabels"] = optionLabels;
  }
  if (Object.keys(errorMessages).length > 0 && !opts["errorMessages"]) {
    opts["errorMessages"] = errorMessages;
  }
  result.options = opts;

  return result;
}

function hydrateElement(element: AnyElement, texts: FormTexts): AnyElement {
  const result = { ...element };

  if (result.elements) {
    result.elements = result.elements.map((child) =>
      hydrateElement(child, texts),
    );
  }

  if (result.type === "Control" && result.scope) {
    return hydrateControl(result, texts);
  }

  if (result.type === "Group" && result.textKey) {
    return hydrateGroup(result, texts);
  }

  if (result.type === "Label" && result.textKey) {
    return hydrateLabel(result, texts);
  }

  return result;
}

function hydrateGroup(result: AnyElement, texts: FormTexts): AnyElement {
  const label = getGroupLabel(texts, result.textKey);
  const description = getGroupDescription(texts, result.textKey);
  if (label && !result.label) result.label = label;
  if (description) {
    result.options = { ...(result.options ?? {}), description };
  }
  return result;
}

function hydrateLabel(result: AnyElement, texts: FormTexts): AnyElement {
  const text = getBannerText(texts, result.textKey);
  if (text && !result.text) result.text = text;
  return result;
}
