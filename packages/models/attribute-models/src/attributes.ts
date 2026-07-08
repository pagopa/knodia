import z from "zod";

export const attributes = {
  knodia: {
    testing_organization: "Testing Organization",
  },
  vc_poc_attributes: {
    companies_registries: "Companies Registries",
    erds: "ERDS",
    training_institutes: "Training Institutes",
  },
  vc_territorial_units: {
    nuts1: "NUTS 1",
    nuts2: "NUTS 2",
    nuts3: "NUTS 3",
  },
} as const satisfies Record<string, Record<string, string>>;

export type AttributeCode<S extends AttributeScheme> =
  keyof (typeof attributes)[S];
export type AttributeScheme = keyof typeof attributes;

// Parallel to `attributes` (same scheme→code keys, enforced by satisfies): a description per code for the documentation modals.
const attributeDescriptions = {
  knodia: {
    testing_organization:
      "Organizations created for users who are testing the Knodia prototype. All Organizations created for onboarded users have this attribute.",
  },
  vc_poc_attributes: {
    companies_registries:
      "Organizations that are official business/company registers (e.g., a chamber of commerce), acting as authoritative sources for company data.",
    erds: "Organizations that are Electronic Registered Delivery Service providers.",
    training_institutes:
      "Organizations that are accredited training/education institutes, acting as authoritative sources for qualifications and training records.",
  },
  vc_territorial_units: {
    nuts1:
      "Organizations representing first-level (largest) administrative divisions of countries, based on the Nomenclature of Territorial Units for Statistics (NUTS). Corresponds, e.g., to “Bundesländer” for Germany or “Gewesten / Régions” for Belgium.",
    nuts2:
      "Organizations representing second-level administrative divisions of countries, based on the Nomenclature of Territorial Units for Statistics (NUTS). Corresponds, e.g., to “Regioni” for Italy or “Comunidades autónomas” for Spain.",
    nuts3:
      "Organizations representing third-level (most granular) administrative divisions of countries, based on the Nomenclature of Territorial Units for Statistics (NUTS). Corresponds, e.g., to “Départements” for France or “Län” (counties) for Sweden.",
  },
} as const satisfies {
  [S in AttributeScheme]: Record<AttributeCode<S>, string>;
};

export function getAttribute({
  code,
  scheme,
}: AttributeId): Attribute | undefined {
  const a: Record<string, Record<string, string>> = attributes;
  const d: Record<string, Record<string, string>> = attributeDescriptions;
  const name = a[scheme]?.[code];
  const description = d[scheme]?.[code];
  if (name === undefined || description === undefined) {
    return undefined;
  }
  return { description, id: { code, scheme }, name };
}

export const AttributeId = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type AttributeId = z.infer<typeof AttributeId>;
export const AttributeGroup = z.array(AttributeId).min(1);
export type AttributeGroup = z.infer<typeof AttributeGroup>;

export const Attribute = z.strictObject({
  description: z.string(),
  id: AttributeId,
  name: z.string(),
});
export type Attribute = z.infer<typeof Attribute>;

export function hasAllRequiredAttributes(
  ownedAttributes: readonly AttributeId[],
  requiredAttributeGroups: readonly AttributeId[][],
): boolean {
  return requiredAttributeGroups.every((group) =>
    group.some((requiredAttr) =>
      isAttributePossessed(ownedAttributes, requiredAttr),
    ),
  );
}

export function isAttributePossessed(
  ownedAttributes: readonly AttributeId[],
  requiredAttribute: AttributeId,
): boolean {
  return ownedAttributes.some(
    (attr) =>
      attr.code === requiredAttribute.code &&
      attr.scheme === requiredAttribute.scheme,
  );
}

const allAttributes: Attribute[] = Object.entries(attributes).flatMap(
  ([scheme, codes]) =>
    Object.keys(codes)
      .map((code) => getAttribute({ code, scheme }))
      .filter((attribute): attribute is Attribute => attribute !== undefined),
);

export function getAttributesFromGroups(
  groups: readonly (readonly AttributeId[])[],
): readonly Attribute[] {
  const seen = new Set<string>();
  const result: Attribute[] = [];
  for (const group of groups) {
    for (const id of group) {
      const key = `${id.scheme}:${id.code}`;
      if (seen.has(key)) {
        continue;
      }
      const attribute = getAttribute(id);
      if (attribute) {
        seen.add(key);
        result.push(attribute);
      }
    }
  }
  return result;
}

export function listAttributes(): readonly Attribute[] {
  return allAttributes;
}
