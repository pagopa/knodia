import Ajv from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

import compactFormUiSchema from "./compact-form/uischema.json";
import dataSharingUiSchema from "./data-sharing/uischema.json";
import flatFormUiSchema from "./flat-form/uischema.json";
import pa31UiSchema from "./pa31/uischema.json";
import threeStepFormUiSchema from "./three-step-form/uischema.json";
import twoFormUiSchema from "./two-form/uischema.json";
import metaSchema from "./uischema.schema.json";

const ajv = new Ajv();
const validate = ajv.compile(metaSchema);

const verticalLayout = (elements: unknown[]) => ({
  elements,
  type: "VerticalLayout",
});

const control = (
  scope: string,
  options: Record<string, unknown> = { widget: "text" },
) => ({
  options,
  scope,
  type: "Control",
});

const rule = (effect: string, condition: Record<string, unknown>) => ({
  condition,
  effect,
});

const leafCondition = (scope: string, schema: unknown) => ({
  schema,
  scope,
});

describe("UI Schema meta-schema", () => {
  it("is a valid JSON Schema 2020-12", () => {
    expect(() => ajv.compile(metaSchema)).not.toThrow();
  });

  describe("validates existing schemas", () => {
    it.each([
      ["pa31", pa31UiSchema],
      ["two-form", twoFormUiSchema],
      ["flat-form", flatFormUiSchema],
      ["compact-form", compactFormUiSchema],
      ["data-sharing", dataSharingUiSchema],
      ["three-step-form", threeStepFormUiSchema],
    ])("%s", (_name, schema) => {
      expect(validate(schema)).toBe(true);
    });
  });

  describe("accepts valid structures", () => {
    it("Group with label, description, and rule", () => {
      const schema = verticalLayout([
        {
          elements: [control("#/properties/foo")],
          label: "My group",
          options: { description: "A helpful description" },
          rule: rule(
            "SHOW",
            leafCondition("#/properties/bar", { const: "yes" }),
          ),
          type: "Group",
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("LabelElement with text and info variant", () => {
      const schema = verticalLayout([
        {
          options: { variant: "info" },
          text: "Some informational text",
          type: "Label",
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("HorizontalLayout as root", () => {
      const schema = {
        elements: [control("#/properties/a"), control("#/properties/b")],
        type: "HorizontalLayout",
      };
      expect(validate(schema)).toBe(true);
    });

    it("nested layout > group > control", () => {
      const schema = verticalLayout([
        {
          elements: [
            {
              elements: [control("#/properties/nested", { widget: "select" })],
              type: "HorizontalLayout",
            },
          ],
          label: "Outer",
          type: "Group",
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("Control with all options", () => {
      const schema = verticalLayout([
        {
          options: {
            hideOptions: {
              B: {
                schema: { const: "hide_b" },
                scope: "#/properties/other",
              },
            },
            widget: "radio",
          },
          scope: "#/properties/field",
          type: "Control",
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("rule with AND condition", () => {
      const schema = verticalLayout([
        {
          ...control("#/properties/field"),
          rule: rule("ENABLE", {
            conditions: [
              leafCondition("#/properties/a", { const: "x" }),
              leafCondition("#/properties/b", { const: "y" }),
            ],
            type: "AND",
          }),
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("rule with contains schema", () => {
      const schema = verticalLayout([
        {
          ...control("#/properties/field"),
          rule: rule(
            "HIDE",
            leafCondition("#/properties/tags", {
              contains: { const: "special" },
            }),
          ),
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("LabelElement with rule", () => {
      const schema = verticalLayout([
        {
          rule: rule(
            "SHOW",
            leafCondition("#/properties/showInfo", { const: "yes" }),
          ),
          text: "Conditional info",
          type: "Label",
        },
      ]);
      expect(validate(schema)).toBe(true);
    });

    it("Group as root element", () => {
      const schema = {
        elements: [control("#/properties/name")],
        label: "Root group",
        type: "Group",
      };
      expect(validate(schema)).toBe(true);
    });

    it("all widget types", () => {
      const widgets = [
        "checkbox",
        "radio",
        "select",
        "switch",
        "text",
        "textarea",
      ];
      for (const widget of widgets) {
        const schema = verticalLayout([control("#/properties/f", { widget })]);
        expect(validate(schema), `widget "${widget}" should be valid`).toBe(
          true,
        );
      }
    });

    it("all rule effects", () => {
      const effects = ["DISABLE", "ENABLE", "HIDE", "SHOW"];
      for (const effect of effects) {
        const schema = verticalLayout([
          {
            ...control("#/properties/f"),
            rule: rule(effect, leafCondition("#/properties/x", { const: "v" })),
          },
        ]);
        expect(validate(schema), `effect "${effect}" should be valid`).toBe(
          true,
        );
      }
    });

    it("hideOptions with contains condition", () => {
      const schema = verticalLayout([
        control("#/properties/field", {
          hideOptions: {
            OPT: {
              schema: { contains: { const: "hide_opt" } },
              scope: "#/properties/tags",
            },
          },
          widget: "checkbox",
        }),
      ]);
      expect(validate(schema)).toBe(true);
    });
  });
});

describe("UI Schema meta-schema — rejects invalid schemas", () => {
  it("Control without scope", () => {
    const invalid = verticalLayout([
      { options: { widget: "text" }, type: "Control" },
    ]);
    expect(validate(invalid)).toBe(false);
  });

  it("unknown widget value", () => {
    expect(
      validate(
        verticalLayout([control("#/properties/foo", { widget: "datepicker" })]),
      ),
    ).toBe(false);
  });

  it("missing elements on layout", () => {
    expect(validate({ type: "VerticalLayout" })).toBe(false);
  });

  it("invalid rule effect", () => {
    const schema = verticalLayout([
      {
        ...control("#/properties/foo"),
        rule: rule("TOGGLE", leafCondition("#/properties/bar", { const: "x" })),
      },
    ]);
    expect(validate(schema)).toBe(false);
  });

  it("unknown property on element", () => {
    const invalid = verticalLayout([
      {
        options: { widget: "text" },
        scope: "#/properties/foo",
        type: "Control",
        unknown: true,
      },
    ]);
    expect(validate(invalid)).toBe(false);
  });

  it("unknown root type", () => {
    expect(validate({ elements: [], type: "Categorization" })).toBe(false);
  });

  it("invalid scope format", () => {
    expect(validate(verticalLayout([control("properties/foo")]))).toBe(false);
  });

  it("Group missing elements", () => {
    expect(
      validate(verticalLayout([{ label: "No elements", type: "Group" }])),
    ).toBe(false);
  });

  it("AND condition with empty conditions array", () => {
    const schema = verticalLayout([
      {
        ...control("#/properties/foo"),
        rule: rule("SHOW", { conditions: [], type: "AND" }),
      },
    ]);
    expect(validate(schema)).toBe(false);
  });

  it("LeafCondition missing scope", () => {
    const schema = verticalLayout([
      {
        ...control("#/properties/foo"),
        rule: rule("SHOW", { schema: { const: "x" } }),
      },
    ]);
    expect(validate(schema)).toBe(false);
  });

  it("Control options missing widget", () => {
    expect(
      validate(
        verticalLayout([
          control("#/properties/foo", { description: "no widget" }),
        ]),
      ),
    ).toBe(false);
  });

  it("unknown property on ControlOptions", () => {
    expect(
      validate(
        verticalLayout([
          control("#/properties/foo", { placeholder: "hi", widget: "text" }),
        ]),
      ),
    ).toBe(false);
  });

  it("Label with invalid variant", () => {
    expect(
      validate(
        verticalLayout([
          { options: { variant: "danger" }, text: "Hello", type: "Label" },
        ]),
      ),
    ).toBe(false);
  });

  it("Rule missing condition", () => {
    const schema = verticalLayout([
      { ...control("#/properties/foo"), rule: { effect: "SHOW" } },
    ]);
    expect(validate(schema)).toBe(false);
  });

  it("Rule missing effect", () => {
    const schema = verticalLayout([
      {
        ...control("#/properties/foo"),
        rule: { condition: leafCondition("#/properties/bar", { const: "x" }) },
      },
    ]);
    expect(validate(schema)).toBe(false);
  });

  it("HideOptionCondition with invalid scope", () => {
    const schema = verticalLayout([
      control("#/properties/foo", {
        hideOptions: {
          OPT: { schema: { const: "x" }, scope: "bad/scope" },
        },
        widget: "checkbox",
      }),
    ]);
    expect(validate(schema)).toBe(false);
  });
});
