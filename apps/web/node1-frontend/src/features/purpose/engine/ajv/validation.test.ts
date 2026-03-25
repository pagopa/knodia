import { describe, expect, it } from "vitest";

import type { JsonSchema } from "../types";

import { createAjvValidator, injectNonEmptyConstraints } from "./validation";

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
});

describe("injectNonEmptyConstraints", () => {
  it("adds minLength to required string properties", () => {
    const patched = injectNonEmptyConstraints(schema) as {
      properties: Record<string, { minLength?: number }>;
    };
    expect(patched.properties["description"]?.minLength).toBe(1);
    expect(patched.properties["purpose"]?.minLength).toBe(1);
  });

  it("adds minItems to required array properties", () => {
    const patched = injectNonEmptyConstraints(schema) as {
      properties: Record<string, { minItems?: number }>;
    };
    expect(patched.properties["legalBasis"]?.minItems).toBe(1);
  });

  it("does not add constraints to non-required properties", () => {
    const patched = injectNonEmptyConstraints(schema) as {
      properties: Record<string, { minItems?: number; minLength?: number }>;
    };
    expect(patched.properties["knowsDataQuantity"]?.minLength).toBeUndefined();
    expect(patched.properties["dataQuantity"]?.minLength).toBeUndefined();
  });

  it("patches then/else properties in allOf conditions", () => {
    const patched = injectNonEmptyConstraints(schema) as {
      allOf: {
        then: { properties?: Record<string, { minLength?: number }> };
      }[];
    };
    // First allOf condition: then requires dataQuantity (enum string)
    const thenProps = patched.allOf.at(0)?.then.properties;
    expect(thenProps?.["dataQuantity"]?.minLength).toBe(1);
  });

  it("preserves existing minLength/minItems if larger", () => {
    const schemaWithExisting: JsonSchema = {
      properties: {
        items: { items: { type: "string" }, minItems: 3, type: "array" },
        name: { minLength: 5, type: "string" },
      },
      required: ["name", "items"],
      type: "object",
    };
    const patched = injectNonEmptyConstraints(schemaWithExisting) as {
      properties: Record<string, { minItems?: number; minLength?: number }>;
    };
    expect(patched.properties["name"]?.minLength).toBe(5);
    expect(patched.properties["items"]?.minItems).toBe(3);
  });
});
