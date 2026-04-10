import { describe, expect, it } from "vitest";

import type {
  FormValues,
  LabelElement,
  RuleCondition,
  UISchema,
} from "./types";

import {
  evaluateCondition,
  getVisibleFields,
  isLabelVisible,
  scopeToFieldName,
} from "./dependencyResolver";

describe("scopeToFieldName", () => {
  it("extracts field name from scope", () => {
    expect(scopeToFieldName("#/properties/purpose")).toBe("purpose");
  });
});

describe("evaluateCondition", () => {
  it("evaluates const condition on string value", () => {
    const condition: RuleCondition = {
      schema: { const: "INSTITUTIONAL" },
      scope: "#/properties/purpose",
    };

    expect(evaluateCondition(condition, { purpose: "INSTITUTIONAL" })).toBe(
      true,
    );
    expect(evaluateCondition(condition, { purpose: "OTHER" })).toBe(false);
  });

  it("evaluates const condition on array value", () => {
    const condition: RuleCondition = {
      schema: { const: "PUBLIC_INTEREST" },
      scope: "#/properties/legalBasis",
    };

    expect(
      evaluateCondition(condition, { legalBasis: ["PUBLIC_INTEREST"] }),
    ).toBe(true);
    expect(
      evaluateCondition(condition, {
        legalBasis: ["CONSENT", "PUBLIC_INTEREST"],
      }),
    ).toBe(true);
    expect(evaluateCondition(condition, { legalBasis: ["CONSENT"] })).toBe(
      false,
    );
  });

  it("evaluates contains condition", () => {
    const condition: RuleCondition = {
      schema: { contains: { const: "GDPR_ART_9" } },
      scope: "#/properties/personalDataTypes",
    };

    expect(
      evaluateCondition(condition, {
        personalDataTypes: ["GDPR_ART_9", "OTHER"],
      }),
    ).toBe(true);
    expect(evaluateCondition(condition, { personalDataTypes: ["OTHER"] })).toBe(
      false,
    );
  });

  it("evaluates AND condition", () => {
    const condition: RuleCondition = {
      conditions: [
        {
          schema: { const: "YES" },
          scope: "#/properties/usesPersonalData",
        },
        {
          schema: { contains: { const: "PUBLIC_INTEREST" } },
          scope: "#/properties/legalBasis",
        },
      ],
      type: "AND",
    };

    expect(
      evaluateCondition(condition, {
        legalBasis: ["PUBLIC_INTEREST"],
        usesPersonalData: "YES",
      }),
    ).toBe(true);

    expect(
      evaluateCondition(condition, {
        legalBasis: ["PUBLIC_INTEREST"],
        usesPersonalData: "NO",
      }),
    ).toBe(false);

    expect(
      evaluateCondition(condition, {
        legalBasis: ["CONSENT"],
        usesPersonalData: "YES",
      }),
    ).toBe(false);
  });
});

describe("getVisibleFields", () => {
  const uischema: UISchema = {
    elements: [
      {
        scope: "#/properties/purpose",
        type: "Control",
      },
      {
        rule: {
          condition: {
            schema: { const: "INSTITUTIONAL" },
            scope: "#/properties/purpose",
          },
          effect: "SHOW",
        },
        scope: "#/properties/institutionalPurpose",
        type: "Control",
      },
      {
        rule: {
          condition: {
            schema: { const: "OTHER" },
            scope: "#/properties/purpose",
          },
          effect: "SHOW",
        },
        scope: "#/properties/otherPurpose",
        type: "Control",
      },
      {
        rule: {
          condition: {
            schema: { const: "YES" },
            scope: "#/properties/usesPersonalData",
          },
          effect: "SHOW",
        },
        scope: "#/properties/personalDataTypes",
        type: "Control",
      },
    ],
    type: "VerticalLayout",
  };

  it("shows fields without rules", () => {
    const visible = getVisibleFields(uischema, { purpose: "" });
    expect(visible.has("purpose")).toBe(true);
  });

  it("shows fields when SHOW condition is met", () => {
    const visible = getVisibleFields(uischema, {
      purpose: "INSTITUTIONAL",
    });
    expect(visible.has("institutionalPurpose")).toBe(true);
    expect(visible.has("otherPurpose")).toBe(false);
  });

  it("hides fields when SHOW condition is not met", () => {
    const visible = getVisibleFields(uischema, { purpose: "OTHER" });
    expect(visible.has("institutionalPurpose")).toBe(false);
    expect(visible.has("otherPurpose")).toBe(true);
  });

  it("handles dependencies on values not yet set", () => {
    const visible = getVisibleFields(uischema, {});
    expect(visible.has("personalDataTypes")).toBe(false);
  });

  it("shows dependent fields when parent changes", () => {
    const values: FormValues = { usesPersonalData: "YES" };
    const visible = getVisibleFields(uischema, values);
    expect(visible.has("personalDataTypes")).toBe(true);
  });
});

describe("isLabelVisible", () => {
  const labelWithoutRule: LabelElement = {
    textKey: "Static label",
    type: "Label",
  };

  const labelShownWhenPurposeIsOther: LabelElement = {
    rule: {
      condition: {
        schema: { const: "OTHER" },
        scope: "#/properties/purpose",
      },
      effect: "SHOW",
    },
    textKey: "Shown when purpose is OTHER",
    type: "Label",
  };

  const labelHiddenWhenPurposeIsOther: LabelElement = {
    rule: {
      condition: {
        schema: { const: "OTHER" },
        scope: "#/properties/purpose",
      },
      effect: "HIDE",
    },
    textKey: "Hidden when purpose is OTHER",
    type: "Label",
  };

  it("is always visible when the label has no rule", () => {
    expect(isLabelVisible(labelWithoutRule, {}, new Set())).toBe(true);
  });

  it("is visible when SHOW condition is met and dependent fields are visible", () => {
    expect(
      isLabelVisible(
        labelShownWhenPurposeIsOther,
        { purpose: "OTHER" },
        new Set(["purpose"]),
      ),
    ).toBe(true);
  });

  it("is hidden when SHOW condition is not met", () => {
    expect(
      isLabelVisible(
        labelShownWhenPurposeIsOther,
        { purpose: "INSTITUTIONAL" },
        new Set(["purpose"]),
      ),
    ).toBe(false);
  });

  it("is hidden when HIDE condition is met", () => {
    expect(
      isLabelVisible(
        labelHiddenWhenPurposeIsOther,
        { purpose: "OTHER" },
        new Set(["purpose"]),
      ),
    ).toBe(false);
  });

  it("is visible when HIDE condition is not met", () => {
    expect(
      isLabelVisible(
        labelHiddenWhenPurposeIsOther,
        { purpose: "INSTITUTIONAL" },
        new Set(["purpose"]),
      ),
    ).toBe(true);
  });

  it("is hidden when a field referenced by the condition is not visible (cascading)", () => {
    // Even if the condition would be met by the value, the label must hide
    // because the referenced field itself is not visible.
    expect(
      isLabelVisible(
        labelShownWhenPurposeIsOther,
        { purpose: "OTHER" },
        new Set(),
      ),
    ).toBe(false);
  });

  it("is hidden when any scope of an AND condition references a hidden field", () => {
    const label: LabelElement = {
      rule: {
        condition: {
          conditions: [
            {
              schema: { const: "YES" },
              scope: "#/properties/usesPersonalData",
            },
            {
              schema: { contains: { const: "PUBLIC_INTEREST" } },
              scope: "#/properties/legalBasis",
            },
          ],
          type: "AND",
        },
        effect: "SHOW",
      },
      textKey: "Shown when both conditions are met",
      type: "Label",
    };

    expect(
      isLabelVisible(
        label,
        { legalBasis: ["PUBLIC_INTEREST"], usesPersonalData: "YES" },
        new Set(["usesPersonalData"]),
      ),
    ).toBe(false);
  });

  it("is visible when an AND condition is fully met and all referenced fields are visible", () => {
    const label: LabelElement = {
      rule: {
        condition: {
          conditions: [
            {
              schema: { const: "YES" },
              scope: "#/properties/usesPersonalData",
            },
            {
              schema: { contains: { const: "PUBLIC_INTEREST" } },
              scope: "#/properties/legalBasis",
            },
          ],
          type: "AND",
        },
        effect: "SHOW",
      },
      textKey: "Shown when both conditions are met",
      type: "Label",
    };

    expect(
      isLabelVisible(
        label,
        { legalBasis: ["PUBLIC_INTEREST"], usesPersonalData: "YES" },
        new Set(["legalBasis", "usesPersonalData"]),
      ),
    ).toBe(true);
  });
});
