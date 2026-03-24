// JSON Schema types (subset we support)

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
  text: string;
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
  label?: string;
  options?: { description?: string };
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

// Typed loaders for JSON imports (centralises the cast in one place).
// The parameter accepts any object with the required shape so that
// JSON imports (which carry their literal type) pass through cleanly.
export function loadSchema(json: {
  properties: Record<string, object>;
  type: string;
}): JsonSchema {
  return json as JsonSchema;
}

export function loadUiSchema(json: {
  elements: readonly object[];
  type: string;
}): UISchema {
  return json as UISchema;
}
