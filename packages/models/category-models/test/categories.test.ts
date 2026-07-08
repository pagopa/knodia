import { describe, expect, it } from "vitest";

import { getCategory, listCategories } from "../src/categories.ts";

describe("getCategory", () => {
  it("returns the category with its display name when scheme and code exist", () => {
    expect(
      getCategory({
        code: "organization.private_company.construction_activity",
        scheme: "vc_example_eservice_categories",
      }),
    ).toEqual({
      description:
        "That process the construction-sector activity of private companies.",
      id: {
        code: "organization.private_company.construction_activity",
        scheme: "vc_example_eservice_categories",
      },
      name: "Construction activity",
    });
  });

  it("resolves the citizen.training.qualifications POC category", () => {
    expect(
      getCategory({
        code: "citizen.training.qualifications",
        scheme: "vc_example_eservice_categories",
      }),
    ).toEqual({
      description:
        "That process the training qualifications and certifications held by citizens.",
      id: {
        code: "citizen.training.qualifications",
        scheme: "vc_example_eservice_categories",
      },
      name: "Training qualifications",
    });
  });

  it("returns undefined for an unknown code in a known scheme", () => {
    expect(
      getCategory({
        code: "unknown.code",
        scheme: "vc_example_eservice_categories",
      }),
    ).toBeUndefined();
  });

  it("returns undefined for an unknown scheme", () => {
    expect(
      getCategory({
        code: "organization.private_company.construction_activity",
        scheme: "unknown_scheme",
      }),
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
      description: "That process the birth date for citizens.",
      id: {
        code: "citizen.identity.birth_date",
        scheme: "vc_example_eservice_categories",
      },
      name: "Birth date",
    });
  });
});
