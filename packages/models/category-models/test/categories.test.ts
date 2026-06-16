import { describe, expect, it } from "vitest";

import { getCategory } from "../src/categories.ts";

describe("getCategory", () => {
  it("returns the category with its display name when scheme and code exist", () => {
    expect(
      getCategory(
        "vc_example_eservice_categories",
        "organization.private_company.construction_activity",
      ),
    ).toEqual({
      code: "organization.private_company.construction_activity",
      name: "Construction activity",
      scheme: "vc_example_eservice_categories",
    });
  });

  it("returns undefined for an unknown code in a known scheme", () => {
    expect(
      getCategory("vc_example_eservice_categories", "unknown.code"),
    ).toBeUndefined();
  });

  it("returns undefined for an unknown scheme", () => {
    expect(
      getCategory(
        "unknown_scheme",
        "organization.private_company.construction_activity",
      ),
    ).toBeUndefined();
  });
});
