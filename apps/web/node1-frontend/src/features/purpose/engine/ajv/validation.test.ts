import { describe, expect, it } from "vitest";

import type { JsonSchema, UISchema } from "../types";

import { getVisibleFields } from "../dependencyResolver";
import { stripHiddenOptionValuesFromAnswers } from "../optionFilter";
import { createAjvValidator } from "./validation";

const schema: JsonSchema = {
  allOf: [
    {
      if: {
        properties: {
          knowsDataQuantity: { const: "YES" },
        },
      },
      then: { required: ["dataQuantity"] },
    },
    {
      if: {
        properties: {
          policyProvided: { const: "NO" },
        },
      },
      then: { required: ["reasonPolicyNotProvided"] },
    },
  ],
  properties: {
    dataQuantity: {
      enum: ["QUANTITY_0_TO_100", "QUANTITY_101_TO_500"],
      type: "string",
    },
    description: { maxLength: 2000, type: "string" },
    knowsDataQuantity: { enum: ["YES", "NO"], type: "string" },
    legalBasis: {
      items: { enum: ["CONSENT", "PUBLIC_INTEREST"], type: "string" },
      type: "array",
      uniqueItems: true,
    },
    policyProvided: { enum: ["YES", "NO"], type: "string" },
    purpose: {
      enum: ["INSTITUTIONAL", "OTHER"],
      type: "string",
    },
    reasonPolicyNotProvided: { maxLength: 2000, type: "string" },
  },
  required: ["purpose", "description", "legalBasis"],
  type: "object",
};

// eslint-disable-next-line max-lines-per-function
describe("createAjvValidator", () => {
  const validate = createAjvValidator(schema, {
    description: { required: "Describe your purpose" },
    purpose: { required: "Please select a purpose" },
  });

  it("returns empty errors for valid data", () => {
    const errors = validate(
      {
        description: "Test",
        legalBasis: ["CONSENT"],
        purpose: "INSTITUTIONAL",
      },
      new Set(["description", "legalBasis", "purpose"]),
    );
    expect(errors).toEqual({});
  });

  it("returns required errors for missing fields", () => {
    const errors = validate(
      { description: "", legalBasis: [], purpose: undefined as never },
      new Set(["description", "legalBasis", "purpose"]),
    );
    expect(errors["purpose"]).toBe("Please select a purpose");
    expect(errors["description"]).toBe("Describe your purpose");
    expect(errors["legalBasis"]).toBeDefined();
  });

  it("only validates visible fields", () => {
    const errors = validate({ purpose: "INSTITUTIONAL" }, new Set(["purpose"]));
    // description and legalBasis are not visible, so no errors for them
    expect(errors).toEqual({});
  });

  it("validates conditional required fields when condition is met", () => {
    const errors = validate(
      {
        description: "Test",
        knowsDataQuantity: "YES",
        legalBasis: ["CONSENT"],
        purpose: "INSTITUTIONAL",
      },
      new Set([
        "dataQuantity",
        "description",
        "knowsDataQuantity",
        "legalBasis",
        "purpose",
      ]),
    );
    expect(errors["dataQuantity"]).toBeDefined();
  });

  it("does not require conditional fields when condition is not met", () => {
    const errors = validate(
      {
        description: "Test",
        knowsDataQuantity: "NO",
        legalBasis: ["CONSENT"],
        purpose: "INSTITUTIONAL",
      },
      new Set([
        "dataQuantity",
        "description",
        "knowsDataQuantity",
        "legalBasis",
        "purpose",
      ]),
    );
    expect(errors["dataQuantity"]).toBeUndefined();
  });

  it("drops allOf conditions whose fields are outside visible set", () => {
    // knowsDataQuantity visible but dataQuantity is not — condition is dropped
    const errors = validate(
      {
        description: "Test",
        knowsDataQuantity: "YES",
        legalBasis: ["CONSENT"],
        purpose: "INSTITUTIONAL",
      },
      new Set(["description", "knowsDataQuantity", "legalBasis", "purpose"]),
    );
    expect(errors["dataQuantity"]).toBeUndefined();
  });

  it("returns enum validation error for invalid value", () => {
    const errors = validate(
      {
        description: "Test",
        legalBasis: ["CONSENT"],
        purpose: "INVALID_VALUE" as never,
      },
      new Set(["description", "legalBasis", "purpose"]),
    );
    expect(errors["purpose"]).toBeDefined();
  });

  // Nested AJV errors report `instancePath` like "/legalBasis/0"; the parser
  // must key the error by the top-level field name, not the full path.
  it("keys nested array-item errors by the top-level field name", () => {
    const errors = validate(
      {
        description: "Test",
        legalBasis: ["INVALID_BASIS" as never],
        purpose: "INSTITUTIONAL",
      },
      new Set(["description", "legalBasis", "purpose"]),
    );
    expect(errors["legalBasis"]).toBeDefined();
    expect(errors["legalBasis/0"]).toBeUndefined();
  });

  describe("hideOptions stripping", () => {
    const hideOptionsSchema: JsonSchema = {
      properties: {
        legalBasisPublicInterest: {
          enum: ["PUBLIC_INTEREST_TASK", "OFFICIAL_AUTHORITY"],
          type: "string",
        },
        personalDataTypes: {
          items: { enum: ["GDPR_ART_9", "OTHER"], type: "string" },
          type: "array",
        },
      },
      required: ["legalBasisPublicInterest", "personalDataTypes"],
      type: "object",
    };

    const scalarHideUischema: UISchema = {
      elements: [
        {
          options: {
            errorMessages: { required: "Pick one" },
            hideOptions: {
              PUBLIC_INTEREST_TASK: {
                schema: { contains: { const: "GDPR_ART_9" } },
                scope: "#/properties/personalDataTypes",
              },
            },
            widget: "radio",
          },
          scope: "#/properties/legalBasisPublicInterest",
          type: "Control",
        },
        {
          options: { widget: "checkbox" },
          scope: "#/properties/personalDataTypes",
          type: "Control",
        },
      ],
      type: "VerticalLayout",
    };

    const visible = new Set(["legalBasisPublicInterest", "personalDataTypes"]);

    it("treats a stale scalar selection as missing required", () => {
      const validate = createAjvValidator(
        hideOptionsSchema,
        { legalBasisPublicInterest: { required: "Pick one" } },
        scalarHideUischema,
      );
      const errors = validate(
        {
          legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
          personalDataTypes: ["GDPR_ART_9"],
        },
        visible,
      );
      expect(errors["legalBasisPublicInterest"]).toBe("Pick one");
    });

    it("passes when current selection is still visible", () => {
      const validate = createAjvValidator(
        hideOptionsSchema,
        {},
        scalarHideUischema,
      );
      const errors = validate(
        {
          legalBasisPublicInterest: "OFFICIAL_AUTHORITY",
          personalDataTypes: ["GDPR_ART_9"],
        },
        visible,
      );
      expect(errors["legalBasisPublicInterest"]).toBeUndefined();
    });

    it("filters hidden array elements; remaining elements satisfy the schema", () => {
      const arrayHideUischema: UISchema = {
        elements: [
          {
            options: {
              hideOptions: {
                GDPR_ART_9: {
                  schema: { const: "PUBLIC_INTEREST_TASK" },
                  scope: "#/properties/legalBasisPublicInterest",
                },
              },
              widget: "checkbox",
            },
            scope: "#/properties/personalDataTypes",
            type: "Control",
          },
          {
            options: { widget: "radio" },
            scope: "#/properties/legalBasisPublicInterest",
            type: "Control",
          },
        ],
        type: "VerticalLayout",
      };
      const validate = createAjvValidator(
        hideOptionsSchema,
        {},
        arrayHideUischema,
      );
      const errors = validate(
        {
          legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
          personalDataTypes: ["GDPR_ART_9", "OTHER"],
        },
        visible,
      );
      expect(errors["personalDataTypes"]).toBeUndefined();
    });

    it("flags a required array that becomes empty after stripping hidden elements", () => {
      const arrayHideUischema: UISchema = {
        elements: [
          {
            options: {
              hideOptions: {
                GDPR_ART_9: {
                  schema: { const: "PUBLIC_INTEREST_TASK" },
                  scope: "#/properties/legalBasisPublicInterest",
                },
                OTHER: {
                  schema: { const: "PUBLIC_INTEREST_TASK" },
                  scope: "#/properties/legalBasisPublicInterest",
                },
              },
              widget: "checkbox",
            },
            scope: "#/properties/personalDataTypes",
            type: "Control",
          },
        ],
        type: "VerticalLayout",
      };
      const validate = createAjvValidator(
        hideOptionsSchema,
        {},
        arrayHideUischema,
      );
      const errors = validate(
        {
          legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
          personalDataTypes: ["GDPR_ART_9", "OTHER"],
        },
        new Set(["personalDataTypes"]),
      );
      expect(errors["personalDataTypes"]).toBeDefined();
    });
  });

  it("respects if.required when computing conditional required fields", () => {
    // Schema where the if-clause uses `required` to guard the condition:
    // the then-branch should only fire when the field is present AND matches.
    const schemaWithIfRequired: JsonSchema = {
      allOf: [
        {
          if: {
            properties: { trigger: { const: "GO" } },
            required: ["trigger"],
          },
          then: { required: ["dependentField"] },
        },
      ],
      properties: {
        dependentField: { type: "string" },
        trigger: { enum: ["GO", "STOP"], type: "string" },
      },
      type: "object",
    };

    const validateWithRequired = createAjvValidator(schemaWithIfRequired, {
      dependentField: { required: "Required when trigger is GO" },
    });

    // trigger is "GO" → dependentField is required → error
    expect(
      validateWithRequired(
        { trigger: "GO" },
        new Set(["dependentField", "trigger"]),
      ),
    ).toHaveProperty("dependentField");

    // trigger is "STOP" → dependentField is NOT required → no error
    expect(
      validateWithRequired(
        { trigger: "STOP" },
        new Set(["dependentField", "trigger"]),
      ),
    ).not.toHaveProperty("dependentField");

    // trigger is "" (form init default): if.required passes (field exists),
    // but const: "GO" fails ("" !== "GO") → if doesn't match → no error
    expect(
      validateWithRequired(
        { trigger: "" },
        new Set(["dependentField", "trigger"]),
      ),
    ).not.toHaveProperty("dependentField");
  });

  // Regression: the per-step subset schema must filter `if.required` to
  // fields visible in the current step. Otherwise a cross-step `if.required`
  // is always missing from the subset values, the `if` fails, and the
  // `else` branch fires spuriously — incorrectly requiring current-step
  // fields that belong to the `if`'s true branch.
  it("filters cross-step fields from if.required so else doesn't fire spuriously", () => {
    const schemaWithCrossStepGuard: JsonSchema = {
      allOf: [
        {
          else: { required: ["elseOnlyField"] },
          if: {
            properties: {
              crossStepGuard: { const: "YES" },
              currentStepTrigger: { const: "A" },
            },
            required: ["crossStepGuard", "currentStepTrigger"],
          },
          then: {},
        },
      ],
      properties: {
        crossStepGuard: { enum: ["YES", "NO"], type: "string" },
        currentStepTrigger: { enum: ["A", "B"], type: "string" },
        elseOnlyField: { type: "string" },
      },
      type: "object",
    };

    const validateCrossStep = createAjvValidator(schemaWithCrossStepGuard, {});

    // `crossStepGuard` was answered on a prior step (present in full form
    // values) but is not in the current step's `visibleFields`, so AJV only
    // sees `currentStepTrigger`. With the filter, `if.required` reduces to
    // `["currentStepTrigger"]`, the `if` matches, and `else` stays dormant.
    // Without the filter, missing `crossStepGuard` in the subset values
    // would fail `if.required`, fire `else`, and demand `elseOnlyField`.
    const errors = validateCrossStep(
      { crossStepGuard: "YES", currentStepTrigger: "A" },
      new Set(["currentStepTrigger", "elseOnlyField"]),
    );
    expect(errors["elseOnlyField"]).toBeUndefined();
  });
});

// Regression for the cascade chain: hiding an option on a parent field
// (legalBasisPublicInterest) must also drop a child field whose SHOW rule
// points to that parent (publicInterestTaskText). Stripping answers first,
// then computing visibility on the cleaned answers, is what closes it.
describe("cascade: stripped parent option drops child SHOW-rule field", () => {
  const cascadeSchema: JsonSchema = {
    properties: {
      legalBasisPublicInterest: {
        enum: ["PUBLIC_INTEREST_TASK", "OFFICIAL_AUTHORITY"],
        type: "string",
      },
      personalDataTypes: {
        items: { enum: ["GDPR_ART_9", "OTHER"], type: "string" },
        type: "array",
      },
      publicInterestTaskText: { type: "string" },
    },
    required: ["legalBasisPublicInterest", "publicInterestTaskText"],
    type: "object",
  };

  const cascadeUischema: UISchema = {
    elements: [
      {
        options: { widget: "checkbox" },
        scope: "#/properties/personalDataTypes",
        type: "Control",
      },
      {
        options: {
          hideOptions: {
            PUBLIC_INTEREST_TASK: {
              schema: { contains: { const: "GDPR_ART_9" } },
              scope: "#/properties/personalDataTypes",
            },
          },
          widget: "radio",
        },
        scope: "#/properties/legalBasisPublicInterest",
        type: "Control",
      },
      {
        options: { widget: "textarea" },
        rule: {
          condition: {
            schema: { const: "PUBLIC_INTEREST_TASK" },
            scope: "#/properties/legalBasisPublicInterest",
          },
          effect: "SHOW",
        },
        scope: "#/properties/publicInterestTaskText",
        type: "Control",
      },
    ],
    type: "VerticalLayout",
  };

  it("drops the dependent field and flags the required parent", () => {
    const cleaned = stripHiddenOptionValuesFromAnswers(
      {
        legalBasisPublicInterest: "PUBLIC_INTEREST_TASK",
        personalDataTypes: ["GDPR_ART_9"],
        publicInterestTaskText: "some text",
      },
      cascadeUischema,
    );
    const visible = getVisibleFields(cascadeUischema, cleaned);

    expect(visible.has("publicInterestTaskText")).toBe(false);

    const validate = createAjvValidator(cascadeSchema, {}, cascadeUischema);
    const errors = validate(cleaned, visible);

    expect(errors["legalBasisPublicInterest"]).toBeDefined();
    expect(errors["publicInterestTaskText"]).toBeUndefined();
  });
});
