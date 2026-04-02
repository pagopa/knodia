export interface AndCondition {
  conditions: RuleCondition[];
  type: "AND";
}

export interface ControlElement {
  label?: string;
  options?: ControlOptions;
  rule?: Rule;
  scope: string;
  type: "Control";
}

// JSON Schema types (subset we support)

// Form texts — all human-readable strings extracted from UI Schema into a
// dedicated locale-keyed texts file. Controls are linked via field name
// (derived from scope), groups/banners via textKey.
export interface FieldTexts {
  description?: string;
  errors?: Record<string, string>;
  label?: string;
  options?: Record<string, string>;
}

export interface FormTexts {
  banners?: Record<string, string>;
  fields: Record<string, FieldTexts>;
  groups?: Record<string, { description?: string; label?: string }>;
}

// Form values
export type FormValues = Record<string, string | string[]>;

// UI Schema types (JSON Forms format + extensions)

export interface JsonSchema {
  $schema?: string;
  allOf?: JsonSchemaConditional[];
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  type: "object";
}

export interface JsonSchemaProperty {
  const?: string;
  default?: string | string[];
  enum?: string[];
  items?: { enum?: string[]; type: "string" };
  maxLength?: number;
  minItems?: number;
  minLength?: number;
  type: "array" | "string";
  uniqueItems?: boolean;
}

export interface LabelElement {
  options?: { variant?: "error" | "info" | "warning" };
  rule?: Rule;
  textKey: string;
  type: "Label";
}

export type RuleCondition = AndCondition | LeafCondition;

export type UISchema = GroupElement | LayoutElement;

export type UISchemaElement =
  | ControlElement
  | GroupElement
  | LabelElement
  | LayoutElement;

// Validation: takes form values + visible fields, returns field-level errors
export type ValidateFn = (
  values: FormValues,
  visibleFields: Set<string>,
) => Record<string, string>;

interface ControlOptions {
  description?: string;
  errorMessages?: Record<string, string>;
  hideOptions?: Record<string, HideOptionCondition>;
  infoLabel?: string;
  optionLabels?: Record<string, string>;
  widget: "checkbox" | "radio" | "select" | "switch" | "text" | "textarea";
}

interface GroupElement {
  elements: UISchemaElement[];
  textKey: string;
  type: "Group";
}

interface HideOptionCondition {
  schema: { const?: string; contains?: { const: string } };
  scope: string;
}

interface JsonSchemaConditional {
  else?: { required?: string[] };
  if: {
    properties: Record<
      string,
      { const?: string; contains?: { const: string } }
    >;
  };
  then: { required?: string[] };
}

interface LayoutElement {
  elements: UISchemaElement[];
  type: "HorizontalLayout" | "VerticalLayout";
}

type LeafCondition =
  | { schema: { const: string }; scope: string }
  | { schema: { contains: { const: string } }; scope: string };

interface Rule {
  condition: RuleCondition;
  effect: "DISABLE" | "ENABLE" | "HIDE" | "SHOW";
}

// Typed loaders that centralise the cast in one place.
// The API returns Record<string, unknown>; these functions cast to the
// engine's internal types so the cast is isolated here.
export function loadSchema(json: Record<string, unknown>): JsonSchema {
  return json as unknown as JsonSchema;
}

export function loadTexts(json: Record<string, unknown>): FormTexts {
  return json as unknown as FormTexts;
}

export function loadUiSchema(json: Record<string, unknown>): UISchema {
  return json as unknown as UISchema;
}
