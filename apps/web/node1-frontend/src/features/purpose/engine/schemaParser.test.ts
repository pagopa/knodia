import { describe, expect, it } from "vitest";

import type { JsonSchema } from "./types";

import { getDefaultValues } from "./schemaParser";

describe("getDefaultValues", () => {
  it("uses explicit default for string enum", () => {
    const schema: JsonSchema = {
      properties: {
        purpose: {
          default: "INSTITUTIONAL",
          enum: ["INSTITUTIONAL", "OTHER"],
          type: "string",
        },
      },
      type: "object",
    };
    expect(getDefaultValues(schema)).toEqual({ purpose: "INSTITUTIONAL" });
  });

  it("uses explicit default for array", () => {
    const schema: JsonSchema = {
      properties: {
        items: {
          default: ["A", "B"],
          items: { type: "string" },
          type: "array",
        },
      },
      type: "object",
    };
    expect(getDefaultValues(schema)).toEqual({ items: ["A", "B"] });
  });

  it("defaults array fields to empty array", () => {
    const schema: JsonSchema = {
      properties: {
        tags: {
          items: { type: "string" },
          type: "array",
        },
      },
      type: "object",
    };
    expect(getDefaultValues(schema)).toEqual({ tags: [] });
  });

  it("defaults string fields without enum to empty string", () => {
    const schema: JsonSchema = {
      properties: {
        description: { maxLength: 2000, type: "string" },
      },
      type: "object",
    };
    expect(getDefaultValues(schema)).toEqual({ description: "" });
  });

  it("leaves enum fields without default undefined", () => {
    const schema: JsonSchema = {
      properties: {
        choice: {
          enum: ["A", "B"],
          type: "string",
        },
      },
      type: "object",
    };
    const values = getDefaultValues(schema);
    expect(values["choice"]).toBeUndefined();
  });

  it("handles a mixed schema", () => {
    const schema: JsonSchema = {
      properties: {
        description: { type: "string" },
        legalBasis: {
          default: [],
          items: { type: "string" },
          type: "array",
        },
        purpose: {
          default: "INSTITUTIONAL",
          enum: ["INSTITUTIONAL", "OTHER"],
          type: "string",
        },
        purposePursuit: {
          enum: ["MERE_CORRECTNESS", "NEW_PERSONAL_DATA"],
          type: "string",
        },
      },
      type: "object",
    };
    const values = getDefaultValues(schema);
    expect(values).toEqual({
      description: "",
      legalBasis: [],
      purpose: "INSTITUTIONAL",
    });
    expect(values["purposePursuit"]).toBeUndefined();
  });
});
