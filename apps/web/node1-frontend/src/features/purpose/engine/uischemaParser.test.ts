import { describe, expect, it } from "vitest";

import type { ControlElement, LabelElement, UISchema } from "./types";

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
    errorMessages: { required: "Please select" },
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
  options: { variant: "info" },
  rule: {
    condition: {
      schema: { const: "NO" },
      scope: "#/properties/doneDpia",
    },
    effect: "SHOW",
  },
  text: "Remember the DPIA is mandatory.",
  type: "Label",
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
  it("extracts error messages keyed by field name", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      type: "VerticalLayout",
    };
    const messages = collectErrorMessages(uischema);
    expect(messages).toEqual({
      purpose: { required: "Please select" },
    });
  });

  it("returns empty object when no controls have error messages", () => {
    const uischema: UISchema = {
      elements: [textControl],
      type: "VerticalLayout",
    };
    expect(collectErrorMessages(uischema)).toEqual({});
  });
});

describe("collectGroups", () => {
  it("wraps everything in a single group when no Groups exist", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      type: "VerticalLayout",
    };
    const groups = collectGroups(uischema);
    expect(groups).toHaveLength(1);
    expect(groups.at(0)?.label).toBeUndefined();
    expect(groups.at(0)?.elements).toEqual([radioControl, textControl]);
  });

  it("extracts Group elements with labels and descriptions", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [radioControl],
          label: "Step 1",
          options: { description: "First step" },
          type: "Group",
        },
        {
          elements: [textControl],
          label: "Step 2",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const groups = collectGroups(uischema);
    expect(groups).toHaveLength(2);
    expect(groups.at(0)?.label).toBe("Step 1");
    expect(groups.at(0)?.description).toBe("First step");
    expect(groups.at(1)?.label).toBe("Step 2");
  });

  it("wraps a top-level Group into a single group", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      label: "Only Group",
      type: "Group",
    };
    const groups = collectGroups(uischema);
    expect(groups).toHaveLength(1);
    expect(groups.at(0)?.label).toBe("Only Group");
    expect(groups.at(0)?.elements).toEqual([radioControl, textControl]);
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
          label: "Nested",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const groups = collectGroups(uischema);
    expect(groups.at(0)?.elements).toEqual([radioControl, textControl]);
  });
});

describe("collectSteps", () => {
  it("wraps all elements in a single step when no Groups exist", () => {
    const uischema: UISchema = {
      elements: [radioControl, textControl],
      type: "VerticalLayout",
    };
    const steps = collectSteps(uischema);
    expect(steps).toHaveLength(1);
    expect(steps.at(0)?.label).toBeUndefined();
    expect(steps.at(0)?.elements).toEqual([radioControl, textControl]);
  });

  it("extracts top-level Groups as steps", () => {
    const uischema: UISchema = {
      elements: [
        {
          elements: [radioControl],
          label: "Lawfulness",
          options: { description: "Step 1 desc" },
          type: "Group",
        },
        {
          elements: [textControl],
          label: "Risk analysis",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const steps = collectSteps(uischema);
    expect(steps).toHaveLength(2);
    expect(steps.at(0)?.label).toBe("Lawfulness");
    expect(steps.at(0)?.description).toBe("Step 1 desc");
    expect(steps.at(1)?.label).toBe("Risk analysis");
  });

  it("preserves raw elements inside steps (does not flatten)", () => {
    const innerGroup = {
      elements: [radioControl],
      label: "Inner",
      type: "Group" as const,
    };
    const uischema: UISchema = {
      elements: [
        {
          elements: [innerGroup, textControl],
          label: "Outer",
          type: "Group",
        },
      ],
      type: "VerticalLayout",
    };
    const steps = collectSteps(uischema);
    expect(steps.at(0)?.elements).toEqual([innerGroup, textControl]);
  });
});
