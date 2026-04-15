import { describe, expect, it } from "vitest";

import type {
  ControlElement,
  FormTexts,
  LabelElement,
  UISchema,
} from "./types";

import {
  collectConditionScopes,
  collectControls,
  collectErrorMessages,
  collectGroups,
  collectSteps,
  isAndCondition,
} from "./uischemaParser";

const radioControl: ControlElement = {
  options: {
    widget: "radio",
  },
  scope: "#/properties/purpose",
  type: "Control",
};

const textControl: ControlElement = {
  options: { widget: "textarea" },
  scope: "#/properties/description",
  type: "Control",
};

const nestedTextControl: ControlElement = {
  options: { widget: "textarea" },
  scope: "#/properties/address/properties/street",
  type: "Control",
};

const conditionalControl: ControlElement = {
  options: { widget: "textarea" },
  rule: {
    condition: {
      schema: { const: "OTHER" },
      scope: "#/properties/purpose",
    },
    effect: "SHOW",
  },
  scope: "#/properties/otherPurpose",
  type: "Control",
};

const labelElement: LabelElement = {
  i18n: "banners.dpiaReminder",
  options: { variant: "info" },
  rule: {
    condition: {
      schema: { const: "NO" },
      scope: "#/properties/doneDpia",
    },
    effect: "SHOW",
  },
  type: "Label",
};

const mockTexts: FormTexts = {
  "address.street.error.required": "Street is required",
  "banners.dpiaReminder.text": "DPIA reminder",
  "groups.inner.label": "Inner",
  "groups.nested.label": "Nested",
  "groups.onlyGroup.label": "Only Group",
  "groups.riskAnalysis.description": "Step 1 desc",
  "groups.riskAnalysis.label": "Risk analysis",
  "groups.step1.description": "First step",
  "groups.step1.label": "Step 1",
  "groups.step2.label": "Step 2",
  "purpose.error.required": "Please select",
  "purpose.label": "Purpose",
};

describe("isAndCondition", () => {
  it("returns true for AND condition", () => {
    expect(
      isAndCondition({
        conditions: [
          { schema: { const: "YES" }, scope: "#/properties/a" },
          { schema: { const: "NO" }, scope: "#/properties/b" },
        ],
        type: "AND",
      }),
    ).toBe(true);
  });

  it("returns false for leaf condition", () => {
    expect(
      isAndCondition({ schema: { const: "YES" }, scope: "#/properties/a" }),
    ).toBe(false);
  });
});

describe("collectConditionScopes", () => {
  it("returns scope from leaf condition", () => {
    expect(
      collectConditionScopes({
        schema: { const: "YES" },
        scope: "#/properties/purpose",
      }),
    ).toEqual(["#/properties/purpose"]);
  });

  it("returns all scopes from AND condition", () => {
    const scopes = collectConditionScopes({
      conditions: [
        { schema: { const: "YES" }, scope: "#/properties/a" },
        { schema: { const: "NO" }, scope: "#/properties/b" },
      ],
      type: "AND",
    });
    expect(scopes).toEqual(["#/properties/a", "#/properties/b"]);
  });
});

describe("collectControls", () => {
  it("returns the control itself", () => {
    expect(collectControls(radioControl)).toEqual([radioControl]);
  });

  it("returns empty for Label elements", () => {
    expect(collectControls(labelElement)).toEqual([]);
  });

  it("flattens nested layouts", () => {
    const layout: UISchema = {
      elements: [
        {
          elements: [radioControl, textControl],
          i18n: "groups.step1",
          type: "Group",
        },
        conditionalControl,
      ],
      type: "VerticalLayout",
    };
    const controls = collectControls(layout);
    expect(controls).toHaveLength(3);
    expect(controls).toEqual([radioControl, textControl, conditionalControl]);
  });
});

describe("collectErrorMessages", () => {
  it("extracts error messages from texts keyed by field name", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      type: "VerticalLayout",
    };
    const messages = collectErrorMessages(mockTexts, uischema);
    expect(messages).toEqual({
      purpose: { required: "Please select" },
    });
  });

  it("returns empty object when no fields have error messages in texts", () => {
    const uischema: UISchema = {
      elements: [textControl],
      type: "VerticalLayout",
    };
    expect(collectErrorMessages(mockTexts, uischema)).toEqual({});
  });

  it("normalizes nested scopes before resolving error messages", () => {
    const uischema: UISchema = {
      elements: [nestedTextControl],
      type: "VerticalLayout",
    };

    expect(collectErrorMessages(mockTexts, uischema)).toEqual({
      "address.street": { required: "Street is required" },
    });
  });
});

describe("collectGroups", () => {
  it("wraps everything in a single group when no Groups exist", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      type: "VerticalLayout",
    };
    const groups = collectGroups(uischema, mockTexts);
    expect(groups).toHaveLength(1);
    expect(groups.at(0)?.label).toBeUndefined();
    expect(groups.at(0)?.elements).toEqual([radioControl, textControl]);
  });

  it("extracts Group elements with labels and descriptions from texts", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [radioControl],
          i18n: "groups.step1",
          type: "Group",
        },
        {
          elements: [textControl],
          i18n: "groups.step2",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const groups = collectGroups(uischema, mockTexts);
    expect(groups).toHaveLength(2);
    expect(groups.at(0)?.label).toBe("Step 1");
    expect(groups.at(0)?.description).toBe("First step");
    expect(groups.at(1)?.label).toBe("Step 2");
  });

  it("wraps a top-level Group into a single group", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      i18n: "groups.onlyGroup",
      type: "Group",
    };
    const groups = collectGroups(uischema, mockTexts);
    expect(groups).toHaveLength(1);
    expect(groups.at(0)?.label).toBe("Only Group");
    expect(groups.at(0)?.elements).toEqual([radioControl, textControl]);
  });

  it("falls back to the raw i18n key when the group label is missing", () => {
    const uischema: UISchema = {
      elements: [radioControl],
      i18n: "groups.missing",
      type: "Group",
    };

    const groups = collectGroups(uischema, mockTexts);

    expect(groups.at(0)?.label).toBe("groups.missing");
  });

  it("flattens nested layouts within groups", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [
            {
              elements: [radioControl, textControl],
              type: "VerticalLayout",
            },
          ],
          i18n: "groups.nested",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const groups = collectGroups(uischema, mockTexts);
    expect(groups.at(0)?.elements).toEqual([radioControl, textControl]);
  });
});

describe("collectSteps", () => {
  it("wraps all elements in a single step when no Groups exist", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      type: "VerticalLayout",
    };
    const steps = collectSteps(uischema, mockTexts);
    expect(steps).toHaveLength(1);
    expect(steps.at(0)?.label).toBeUndefined();
    expect(steps.at(0)?.elements).toEqual([radioControl, textControl]);
  });

  it("extracts top-level Groups as steps with labels from texts", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [radioControl],
          i18n: "groups.riskAnalysis",
          type: "Group",
        },
        {
          elements: [textControl],
          i18n: "groups.step2",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const steps = collectSteps(uischema, mockTexts);
    expect(steps).toHaveLength(2);
    expect(steps.at(0)?.label).toBe("Risk analysis");
    expect(steps.at(0)?.description).toBe("Step 1 desc");
    expect(steps.at(1)?.label).toBe("Step 2");
  });

  it("falls back to the raw i18n key when the step label is missing", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [radioControl],
          i18n: "groups.missing",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };

    const steps = collectSteps(uischema, mockTexts);

    expect(steps.at(0)?.label).toBe("groups.missing");
  });

  it("preserves raw elements inside steps (does not flatten)", () => {
    const innerGroup = {
      elements: [radioControl],
      i18n: "groups.inner",
      type: "Group" as const,
    };
    const uischema: UISchema = {
      elements: [
        {
          elements: [innerGroup, textControl],
          i18n: "groups.nested",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const steps = collectSteps(uischema, mockTexts);
    expect(steps.at(0)?.elements).toEqual([innerGroup, textControl]);
  });
});
