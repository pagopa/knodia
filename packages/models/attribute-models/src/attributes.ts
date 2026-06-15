import z from "zod";

export const attributes = {
  vc_poc_attributes: {
    companies_registries: "Companies Registries",
  },
  knodia: {
    testing_organization: "Testing Organization",
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

export function getAttribute({
  code,
  scheme,
}: AttributeId): Attribute | undefined {
  const a: Record<string, Record<string, string>> = attributes;
  const name = a[scheme]?.[code];
  if (name === undefined) {
    return undefined;
  }
  return { id: { code, scheme }, name };
}

export const AttributeId = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type AttributeId = z.infer<typeof AttributeId>;
export const AttributeGroup = z.array(AttributeId).min(1);
export type AttributeGroup = z.infer<typeof AttributeGroup>;

export const Attribute = z.strictObject({
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
