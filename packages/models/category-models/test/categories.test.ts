import { describe, expect, it } from "vitest";

import { getCategory, listCategories } from "../src/categories.ts";

describe("getCategory", () => {
  it("returns the category with its display name when scheme and code exist", () => {
    expect(
      getCategory(
        "vc_example_eservice_categories",
        "organization.private_company.construction_activity",
      ),
    ).toEqual({
      code: "organization.private_company.construction_activity",
      description:
        "That process the construction-sector activity of private companies.",
      name: "Construction activity",
      scheme: "vc_example_eservice_categories",
    });
  });

  it("resolves the citizen.training.qualifications POC category", () => {
    expect(
      getCategory(
        "vc_example_eservice_categories",
        "citizen.training.qualifications",
      ),
    ).toEqual({
      code: "citizen.training.qualifications",
      description:
        "That process the training qualifications and certifications held by citizens.",
      name: "Training qualifications",
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

describe("listCategories", () => {
  it("returns every catalog category resolved with its description", () => {
    const all = listCategories();

    expect(all).toHaveLength(13);
    expect(
      all.every((c) => c.name.length > 0 && c.description.length > 0),
    ).toBe(true);
    expect(all).toContainEqual({
      code: "citizen.identity.birth_date",
      description: "That process the birth date for citizens.",
      name: "Birth date",
      scheme: "vc_example_eservice_categories",
    });
  });
});
