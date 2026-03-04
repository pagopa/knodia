import z from "zod";

export const attributes: Record<string, Record<string, string>> = {
  vc_territorial_units: {
    nuts1: "NUTS 1",
    nuts2: "NUTS 2",
    nuts3: "NUTS 3",
  },
};

export function getAttribute({
  code,
  scheme,
}: AttributeId): Attribute | undefined {
  const name = attributes[scheme]?.[code];
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
