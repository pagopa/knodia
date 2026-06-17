import { describe, expect, it } from "vitest";

import {
  getAttribute,
  hasAllRequiredAttributes,
  isAttributePossessed,
} from "../src/attributes.ts";

const nuts1 = { code: "nuts1", scheme: "vc_territorial_units" };
const nuts2 = { code: "nuts2", scheme: "vc_territorial_units" };
const nuts3 = { code: "nuts3", scheme: "vc_territorial_units" };
const other = { code: "other_code", scheme: "other_scheme" };

describe("getAttribute", () => {
  it("returns the attribute with its display name when scheme and code exist", () => {
    expect(
      getAttribute({
        code: "companies_registries",
        scheme: "vc_poc_attributes",
      }),
    ).toEqual({
      id: { code: "companies_registries", scheme: "vc_poc_attributes" },
      name: "Companies Registries",
    });
  });

  it("resolves the vc_poc_attributes/erds_poc attribute", () => {
    expect(
      getAttribute({ code: "erds_poc", scheme: "vc_poc_attributes" }),
    ).toEqual({
      id: { code: "erds_poc", scheme: "vc_poc_attributes" },
      name: "ERDS POC",
    });
  });

  it("returns undefined for an unknown code in a known scheme", () => {
    expect(
      getAttribute({ code: "unknown", scheme: "vc_poc_attributes" }),
    ).toBeUndefined();
  });

  it("returns undefined for an unknown scheme", () => {
    expect(
      getAttribute({ code: "companies_registries", scheme: "unknown_scheme" }),
    ).toBeUndefined();
  });
});

describe("isAttributePossessed", () => {
  it("returns true when an owned attribute matches both code and scheme", () => {
    expect(isAttributePossessed([nuts1, nuts2], nuts1)).toBe(true);
  });

  it("returns false when code matches but scheme does not", () => {
    const wrongScheme = { code: "nuts1", scheme: "other_scheme" };
    expect(isAttributePossessed([nuts1], wrongScheme)).toBe(false);
  });

  it("returns false when scheme matches but code does not", () => {
    const wrongCode = { code: "unknown", scheme: "vc_territorial_units" };
    expect(isAttributePossessed([nuts1], wrongCode)).toBe(false);
  });

  it("returns false when no owned attribute matches", () => {
    expect(isAttributePossessed([nuts1, nuts2], other)).toBe(false);
  });

  it("returns false when owned attributes list is empty", () => {
    expect(isAttributePossessed([], nuts1)).toBe(false);
  });
});

describe("hasAllRequiredAttributes", () => {
  it("returns true when all groups are satisfied (one attr per group)", () => {
    expect(hasAllRequiredAttributes([nuts1, nuts2], [[nuts1], [nuts2]])).toBe(
      true,
    );
  });

  it("returns true when a group is satisfied by any of its alternatives (OR semantics)", () => {
    // Group [nuts1, nuts2] is satisfied if the consumer has nuts1 OR nuts2
    expect(hasAllRequiredAttributes([nuts2], [[nuts1, nuts2]])).toBe(true);
  });

  it("returns false when at least one group is entirely unsatisfied", () => {
    expect(hasAllRequiredAttributes([nuts1], [[nuts1], [nuts2]])).toBe(false);
  });

  it("returns true for empty required groups (vacuous truth)", () => {
    expect(hasAllRequiredAttributes([], [])).toBe(true);
  });

  it("returns false when a group has no matching owned attributes", () => {
    expect(hasAllRequiredAttributes([nuts1], [[other]])).toBe(false);
  });

  it("returns true when consumer has extra unrelated attributes", () => {
    expect(
      hasAllRequiredAttributes(
        [nuts1, nuts2, nuts3, other],
        [[nuts1], [nuts3]],
      ),
    ).toBe(true);
  });

  it("returns false when owned attributes are empty and groups are not", () => {
    expect(hasAllRequiredAttributes([], [[nuts1]])).toBe(false);
  });
});

describe("getAttribute", () => {
  it("resolves the knodia/testing_organization attribute", () => {
    expect(
      getAttribute({ code: "testing_organization", scheme: "knodia" }),
    ).toEqual({
      id: { code: "testing_organization", scheme: "knodia" },
      name: "Testing Organization",
    });
  });

  it("resolves an existing vc_territorial_units attribute", () => {
    expect(getAttribute(nuts1)).toEqual({
      id: { code: "nuts1", scheme: "vc_territorial_units" },
      name: "NUTS 1",
    });
  });

  it("returns undefined for an unknown code in a known scheme", () => {
    expect(getAttribute({ code: "nope", scheme: "knodia" })).toBeUndefined();
  });

  it("returns undefined for an unknown scheme", () => {
    expect(
      getAttribute({ code: "testing_organization", scheme: "nope" }),
    ).toBeUndefined();
  });
});
