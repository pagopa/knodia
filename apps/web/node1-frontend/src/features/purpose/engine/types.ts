export interface AndCondition {
  conditions: RuleCondition[];
  type: "AND";
}

// UI Schema types (JSON Forms format + extensions)
//
// The ui-schema file carries only structural information: widgets, conditions
// and `i18n` identifiers for groups. All user-facing text (labels, descriptions,
// option labels, error messages) lives in the external `texts.en.json` /
// `ui-texts.en.json` files and is resolved at render time — the fields below
// that carry text (`label` on ControlElement, `description`/`optionLabels` on
// ControlOptions) are populated by the renderer from those dictionaries, not
// read from the ui-schema itself.
export interface ControlElement {
  label?: string;
  options?: ControlOptions;
  rule?: Rule;
  scope: string;
  type: "Control";
}

export type FormTexts = Record<string, string>;

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

// Narrowed control shape used by the sub-renderers. The FieldRenderer resolves
// labels/descriptions/option labels from the texts dictionary and passes only
// what the renderers need.
export interface ResolvedControl {
  label?: string;
  options?: {
    description?: string;
    optionLabels?: Record<string, string>;
    widget: ControlOptions["widget"];
  };
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
  description?: string;
  hideOptions?: Record<string, HideOptionCondition>;
  optionLabels?: Record<string, string>;
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

// Typed loaders that centralise the cast in one place.
// The API returns Record<string, unknown>; these functions cast to the
// engine's internal types so the cast is isolated here.
export function loadSchema(json: Record<string, unknown>): JsonSchema {
  return json as unknown as JsonSchema;
}

export function loadTexts(json: Record<string, unknown>): FormTexts {
  return json as FormTexts;
}

export function loadUiSchema(json: Record<string, unknown>): UISchema {
  return json as unknown as UISchema;
}
