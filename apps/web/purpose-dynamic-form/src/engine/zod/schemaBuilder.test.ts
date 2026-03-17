import { describe, expect, it } from "vitest";

import type { JsonSchema } from "../types";

import { buildZodSchema } from "./schemaBuilder";

const testSchema: JsonSchema = {
  allOf: [
    {
      if: {
        properties: { purpose: { const: "INSTITUTIONAL" } },
      },
      then: { required: ["institutionalPurpose"] },
    },
  ],
  properties: {
    institutionalPurpose: {
      maxLength: 2000,
      type: "string",
    },
    personalDataTypes: {
      items: {
        enum: ["WITH_NON_IDENTIFYING_DATA", "GDPR_ART_9", "OTHER"],
        type: "string",
      },
      type: "array",
      uniqueItems: true,
    },
    purpose: {
      default: "INSTITUTIONAL",
      enum: ["INSTITUTIONAL", "OTHER"],
      type: "string",
    },
  },
  required: ["purpose"],
  type: "object",
};

describe("buildZodSchema", () => {
  it("rejects empty string for required field", () => {
    const schema = buildZodSchema(testSchema, new Set(["purpose"]), {
      purpose: "INSTITUTIONAL",
    });

    expect(schema.safeParse({ purpose: "INSTITUTIONAL" }).success).toBe(true);
    expect(schema.safeParse({ purpose: "" }).success).toBe(false);
  });

  it("excludes non-visible fields from validation", () => {
    const schema = buildZodSchema(testSchema, new Set(["purpose"]), {
      purpose: "OTHER",
    });

    // institutionalPurpose is not visible, so not validated
    expect(schema.safeParse({ purpose: "INSTITUTIONAL" }).success).toBe(true);
  });

  it("validates conditionally required fields", () => {
    const schema = buildZodSchema(
      testSchema,
      new Set(["institutionalPurpose", "purpose"]),
      { purpose: "INSTITUTIONAL" },
    );

    expect(
      schema.safeParse({ institutionalPurpose: "", purpose: "INSTITUTIONAL" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({
        institutionalPurpose: "some text",
        purpose: "INSTITUTIONAL",
      }).success,
    ).toBe(true);
  });

  it("accepts empty values for non-required fields", () => {
    const schema = buildZodSchema(
      testSchema,
      new Set(["personalDataTypes", "purpose"]),
      { purpose: "INSTITUTIONAL" },
    );

    // personalDataTypes is not required, so empty array is fine
    expect(
      schema.safeParse({ personalDataTypes: [], purpose: "INSTITUTIONAL" })
        .success,
    ).toBe(true);
    expect(schema.safeParse({ purpose: "INSTITUTIONAL" }).success).toBe(true);
  });

  it("rejects empty array for required array field", () => {
    const schemaWithRequiredArray: JsonSchema = {
      ...testSchema,
      required: ["purpose", "personalDataTypes"],
    };
    const schema = buildZodSchema(
      schemaWithRequiredArray,
      new Set(["personalDataTypes", "purpose"]),
      { purpose: "INSTITUTIONAL" },
    );

    expect(
      schema.safeParse({ personalDataTypes: [], purpose: "INSTITUTIONAL" })
        .success,
    ).toBe(false);
    expect(
      schema.safeParse({
        personalDataTypes: ["GDPR_ART_9"],
        purpose: "INSTITUTIONAL",
      }).success,
    ).toBe(true);
  });

  it("respects maxLength constraint", () => {
    const schema = buildZodSchema(
      testSchema,
      new Set(["institutionalPurpose", "purpose"]),
      { purpose: "INSTITUTIONAL" },
    );

    const longText = "a".repeat(2001);
    expect(
      schema.safeParse({
        institutionalPurpose: longText,
        purpose: "INSTITUTIONAL",
      }).success,
    ).toBe(false);

    expect(
      schema.safeParse({
        institutionalPurpose: "a".repeat(2000),
        purpose: "INSTITUTIONAL",
      }).success,
    ).toBe(true);
  });

  it("uses required error message for empty required fields", () => {
    const schema = buildZodSchema(
      testSchema,
      new Set(["institutionalPurpose", "purpose"]),
      { purpose: "INSTITUTIONAL" },
      { institutionalPurpose: { required: "Campo obbligatorio" } },
    );

    const result = schema.safeParse({
      institutionalPurpose: "",
      purpose: "INSTITUTIONAL",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Campo obbligatorio");
    }
  });
});
