export interface AndCondition {
  conditions: RuleCondition[];
  type: "AND";
}

// UI Schema types (JSON Forms format + extensions)
//
// The ui-schema file carries only structural information: widgets, conditions
// and `i18n` identifiers for groups. All user-facing text (labels, descriptions,
// option labels, error messages) lives in the external `texts.en.json` /
// `ui-texts.en.json` files and is resolved at render time.
export interface ControlElement {
  options?: ControlOptions;
  rule?: Rule;
  scope: string;
  type: "Control";
}

export type FormValues = Record<string, string | string[]>;

export interface JsonSchema {
  $schema?: string;
  allOf?: JsonSchemaConditional[];
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  type: "object";
}

export interface JsonSchemaIfClause {
  properties?: Record<
    string,
    {
      const?: string;
      contains?: { const: string };
      type?: "array" | "string";
    }
  >;
  required?: string[];
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

export type RuleCondition = AndCondition | LeafCondition;

export type UISchema = GroupElement | LayoutElement;

export type UISchemaElement = ControlElement | GroupElement | LayoutElement;

// Validation: takes form values + visible fields, returns field-level errors
export type ValidateFn = (
  values: FormValues,
  visibleFields: Set<string>,
) => Record<string, string>;

interface ControlOptions {
  hideOptions?: Record<string, HideOptionCondition>;
  widget: "checkbox" | "radio" | "select" | "switch" | "text" | "textarea";
}

interface GroupElement {
  elements: UISchemaElement[];
  i18n: string;
  type: "Group";
}

interface HideOptionCondition {
  schema: { const?: string; contains?: { const: string } };
  scope: string;
}

interface JsonSchemaConditional {
  else?: { required?: string[] };
  if: JsonSchemaIfClause;
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

export function loadSchema(json: Record<string, unknown>): JsonSchema {
  return json as unknown as JsonSchema;
}

export function loadUiSchema(json: Record<string, unknown>): UISchema {
  return json as unknown as UISchema;
}
