import {
  and,
  isEnumControl,
  isStringControl,
  optionIs,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from "@jsonforms/core";

// rankWith(priority, predicate) — JSON Forms picks the renderer with the highest
// priority whose predicate returns true. Built-in vanilla renderers use priority 2–3,
// so priority 10 ensures our custom renderers always win over defaults.

// Matches array properties with enum items (e.g. multi-select checkboxes)
export const enumArrayTester = rankWith(
  10,
  and(
    uiTypeIs("Control"),
    schemaMatches(
      (schema) =>
        schema.type === "array" &&
        schema.items !== undefined &&
        !Array.isArray(schema.items) &&
        schema.items.enum !== undefined,
    ),
  ),
);

// Matches enum string properties with widget: "radio"
export const radioTester = rankWith(
  10,
  and(isEnumControl, optionIs("widget", "radio")),
);

// Matches enum string properties with widget: "switch"
export const switchTester = rankWith(
  10,
  and(isEnumControl, optionIs("widget", "switch")),
);

// Matches string properties with widget: "textarea"
export const textareaTester = rankWith(
  10,
  and(isStringControl, optionIs("widget", "textarea")),
);
