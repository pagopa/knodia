import { describe, expect, it } from "vitest";

import type { JsonSchema } from "../types";

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

    // trigger is missing (empty string from form init) → if.required fails
    // because the field exists but doesn't match "GO" → no error
    expect(
      validateWithRequired(
        { trigger: "" },
        new Set(["dependentField", "trigger"]),
      ),
    ).not.toHaveProperty("dependentField");
  });
});
