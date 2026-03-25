import { describe, expect, it } from "vitest";

import type { JsonSchema } from "./types";

import { getRequiredFields } from "./requiredFields";

const schema: JsonSchema = {
  allOf: [
    {
      if: {
        properties: {
          personalDataTypes: {
            contains: { const: "OTHER" },
          },
        },
      },
      then: { required: ["otherPersonalDataTypes"] },
    },
    {
      if: {
        properties: {
          legalBasis: {
            contains: { const: "PUBLIC_INTEREST" },
          },
        },
      },
      then: {
        required: ["publicInterestReasons", "legalBasisPublicInterest"],
      },
    },
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
    {
      if: {
        properties: {
          policyProvided: { const: "YES" },
        },
      },
      then: { required: ["policyProvidedMedium"] },
    },
    {
      else: { required: ["fallbackField"] },
      if: {
        properties: {
          someTrigger: { const: "TRIGGER" },
        },
      },
      then: { required: ["triggerField"] },
    },
  ],
  properties: {
    knowsDataQuantity: { enum: ["YES", "NO"], type: "string" },
    legalBasis: {
      items: { type: "string" },
      type: "array",
    },
    personalDataTypes: {
      items: { type: "string" },
      type: "array",
    },
    policyProvided: { enum: ["YES", "NO"], type: "string" },
    purpose: { enum: ["INSTITUTIONAL", "OTHER"], type: "string" },
    purposeDescription: { type: "string" },
    someTrigger: { type: "string" },
  },
  required: [
    "purpose",
    "purposeDescription",
    "personalDataTypes",
    "legalBasis",
  ],
  type: "object",
};

describe("getRequiredFields", () => {
  it("returns static required fields when no conditions match", () => {
    const required = getRequiredFields(schema, {});
    expect(required).toEqual(
      new Set([
        "fallbackField",
        "legalBasis",
        "personalDataTypes",
        "purpose",
        "purposeDescription",
      ]),
    );
  });

  it("adds conditional field when const condition matches", () => {
    const required = getRequiredFields(schema, { knowsDataQuantity: "YES" });
    expect(required.has("dataQuantity")).toBe(true);
  });

  it("does not add conditional field when const condition does not match", () => {
    const required = getRequiredFields(schema, { knowsDataQuantity: "NO" });
    expect(required.has("dataQuantity")).toBe(false);
  });

  it("adds conditional field when contains condition matches on array", () => {
    const required = getRequiredFields(schema, {
      personalDataTypes: ["OTHER", "WITH_IDENTIFYING_DATA"],
    });
    expect(required.has("otherPersonalDataTypes")).toBe(true);
  });

  it("does not add conditional field when contains condition does not match", () => {
    const required = getRequiredFields(schema, {
      personalDataTypes: ["WITH_IDENTIFYING_DATA"],
    });
    expect(required.has("otherPersonalDataTypes")).toBe(false);
  });

  it("adds multiple fields from a single condition", () => {
    const required = getRequiredFields(schema, {
      legalBasis: ["PUBLIC_INTEREST"],
    });
    expect(required.has("publicInterestReasons")).toBe(true);
    expect(required.has("legalBasisPublicInterest")).toBe(true);
  });

  it("adds else fields when if condition is not met", () => {
    const required = getRequiredFields(schema, { someTrigger: "OTHER" });
    expect(required.has("fallbackField")).toBe(true);
    expect(required.has("triggerField")).toBe(false);
  });

  it("adds then fields and omits else when if condition is met", () => {
    const required = getRequiredFields(schema, { someTrigger: "TRIGGER" });
    expect(required.has("triggerField")).toBe(true);
    expect(required.has("fallbackField")).toBe(false);
  });

  it("handles multiple conditions matching simultaneously", () => {
    const required = getRequiredFields(schema, {
      knowsDataQuantity: "YES",
      policyProvided: "NO",
    });
    expect(required.has("dataQuantity")).toBe(true);
    expect(required.has("reasonPolicyNotProvided")).toBe(true);
    expect(required.has("policyProvidedMedium")).toBe(false);
  });

  it("handles schema with no allOf", () => {
    const simpleSchema: JsonSchema = {
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
      type: "object",
    };
    const required = getRequiredFields(simpleSchema, {});
    expect(required).toEqual(new Set(["name"]));
  });
});
