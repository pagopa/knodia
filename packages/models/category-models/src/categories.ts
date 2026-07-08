import z from "zod";

export const categories = {
  vc_example_eservice_categories: {
    "citizen.identity.birth_date": "Birth date",
    "citizen.identity.birth_place": "Birth place",
    "citizen.identity.marital_status": "Marital status",
    "citizen.residence.digital_domicile": "Citizen digital domicile",
    "citizen.residence.residence_place": "Residence place",
    "citizen.training.qualifications": "Training qualifications",
    "organization.private_company.address": "Company address",
    "organization.private_company.construction_activity":
      "Construction activity",
    "organization.private_company.digital_domicile": "Company digital domicile",
    "organization.private_company.economic_activity": "Economic activity",
    "organization.public_administration.address": "PA address",
    "organization.public_administration.digital_domicile":
      "PA digital domicile",
    "organization.public_administration.typology": "PA typology",
  },
} as const satisfies Record<string, Record<string, string>>;

export type CategoryCode<S extends CategoryScheme> =
  keyof (typeof categories)[S];
export type CategoryScheme = keyof typeof categories;

// Parallel to `categories` (same keys, enforced by satisfies). The canonical
// "E-Services that process …" prefix is dropped because the modal card already names the category.
const categoryDescriptions = {
  vc_example_eservice_categories: {
    "citizen.identity.birth_date": "That process the birth date for citizens.",
    "citizen.identity.birth_place":
      "That process the place of birth for citizens.",
    "citizen.identity.marital_status":
      "That process the marital status for citizens.",
    "citizen.residence.digital_domicile":
      "That process the digital domicile (certified electronic address) of citizens.",
    "citizen.residence.residence_place":
      "That process the place of residence for citizens.",
    "citizen.training.qualifications":
      "That process the training qualifications and certifications held by citizens.",
    "organization.private_company.address":
      "That process the registered address of private companies.",
    "organization.private_company.construction_activity":
      "That process the construction-sector activity of private companies.",
    "organization.private_company.digital_domicile":
      "That process the digital domicile (certified electronic address) of private companies.",
    "organization.private_company.economic_activity":
      "That process the economic activity (e.g. sector / NACE classification) of private companies.",
    "organization.public_administration.address":
      "That process the official address of public administrations.",
    "organization.public_administration.digital_domicile":
      "That process the digital domicile (certified electronic address) of public administrations.",
    "organization.public_administration.typology":
      "That process the typology / classification of public administrations.",
  },
} as const satisfies { [S in CategoryScheme]: Record<CategoryCode<S>, string> };

export function getCategory({
  code,
  scheme,
}: CategoryId): Category | undefined {
  const c: Record<string, Record<string, string>> = categories;
  const d: Record<string, Record<string, string>> = categoryDescriptions;
  const name = c[scheme]?.[code];
  const description = d[scheme]?.[code];
  if (name === undefined || description === undefined) {
    return undefined;
  }
  return { description, id: { code, scheme }, name };
}

// A category is a reference into an external dictionary, not a Knodia-owned
// entity, so it is identified by the (scheme, code) pair that locates it in
// that dictionary rather than by a UUID. Mirrors AttributeId.
export const CategoryId = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type CategoryId = z.infer<typeof CategoryId>;

export const Category = z.strictObject({
  description: z.string(),
  id: CategoryId,
  name: z.string(),
});
export type Category = z.infer<typeof Category>;

const allCategories: Category[] = Object.entries(categories).flatMap(
  ([scheme, codes]) =>
    Object.keys(codes)
      .map((code) => getCategory({ code, scheme }))
      .filter((category): category is Category => category !== undefined),
);

export function listCategories(): readonly Category[] {
  return allCategories;
}
