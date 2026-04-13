/* eslint-disable perfectionist/sort-sets */
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
            type: "array",
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
            type: "array",
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
        required: ["knowsDataQuantity"],
      },
      then: { required: ["dataQuantity"] },
    },
    {
      if: {
        properties: {
          policyProvided: { const: "NO" },
        },
        required: ["policyProvided"],
      },
      then: { required: ["reasonPolicyNotProvided"] },
    },
    {
      if: {
        properties: {
          policyProvided: { const: "YES" },
        },
        required: ["policyProvided"],
      },
      then: { required: ["policyProvidedMedium"] },
    },
    {
      else: { required: ["fallbackField"] },
      if: {
        properties: {
          someTrigger: { const: "TRIGGER" },
        },
        required: ["someTrigger"],
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
  it("on empty values, returns top-level required plus every conditional branch that fires", () => {
    const required = getRequiredFields(schema, {});
    expect(required).toEqual(
      new Set([
        // top-level required
        "purpose",
        "purposeDescription",
        "personalDataTypes",
        "legalBasis",
        // then-branches whose `if` has no `required`: with {} the if matches
        // and the then fires
        "otherPersonalDataTypes",
        "publicInterestReasons",
        "legalBasisPublicInterest",
        // else-branch whose `if` has `required: ["someTrigger"]`: with {} the
        // if fails and the else fires
        "fallbackField",
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

  it("matches the then branch when the field checked by `if` is missing and `if.required` is absent", () => {
    const looseSchema: JsonSchema = {
      allOf: [
        {
          else: { required: ["fallbackField"] },
          if: { properties: { foo: { const: "BAR" } } },
          then: { required: ["bazField"] },
        },
      ],
      properties: {
        bazField: { type: "string" },
        fallbackField: { type: "string" },
        foo: { type: "string" },
      },
      type: "object",
    };

    expect(getRequiredFields(looseSchema, {})).toEqual(new Set(["bazField"]));
  });

  it("matches the else branch when the field checked by `if` is missing and `if.required` lists it", () => {
    const strictSchema: JsonSchema = {
      allOf: [
        {
          else: { required: ["fallbackField"] },
          if: {
            properties: { foo: { const: "BAR" } },
            required: ["foo"],
          },
          then: { required: ["bazField"] },
        },
      ],
      properties: {
        bazField: { type: "string" },
        fallbackField: { type: "string" },
        foo: { type: "string" },
      },
      type: "object",
    };

    expect(getRequiredFields(strictSchema, {})).toEqual(
      new Set(["fallbackField"]),
    );
  });

  it("does not match `const` against an array element (const is strict equality, not array containment)", () => {
    const constSchema: JsonSchema = {
      allOf: [
        {
          if: {
            properties: { foo: { const: "YES", type: "string" } },
            required: ["foo"],
          },
          then: { required: ["bazField"] },
        },
      ],
      properties: {
        bazField: { type: "string" },
        foo: { items: { type: "string" }, type: "array" },
      },
      type: "object",
    };

    // ["YES"] !== "YES" — the if must NOT match, then must NOT fire.
    // (The previous implementation incorrectly treated this as a match by
    // falling back to includes() when the value was an array.)
    expect(getRequiredFields(constSchema, { foo: ["YES"] })).toEqual(new Set());
  });

  it("fails the `if` when the value type does not match `if.properties[*].type`", () => {
    const typedSchema: JsonSchema = {
      allOf: [
        {
          if: {
            properties: {
              foo: { contains: { const: "BAR" }, type: "array" },
            },
            required: ["foo"],
          },
          then: { required: ["bazField"] },
        },
      ],
      properties: {
        bazField: { type: "string" },
        foo: { type: "string" },
      },
      type: "object",
    };

    // Value is a string, but the if-clause declares type: "array" — must fail.
    expect(getRequiredFields(typedSchema, { foo: "BAR" })).toEqual(new Set());
  });
});
