export const Attribute = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type Attribute = z.infer<typeof Attribute>;
export const AttributeGroup = z.array(Attribute).min(1);
export type AttributeGroup = z.infer<typeof AttributeGroup>;

export const attributes: Record<string, Record<string, string>> = {
  vc_territorial_units: {
    nuts1: "NUTS 1",
    nuts2: "NUTS 2",
    nuts3: "NUTS 3",
  },
};

export function getAttribute(
  scheme: string,
  code: string,
): (Attribute & { name: string }) | undefined {
  const name = attributes[scheme]?.[code];
  if (name === undefined) {
    return undefined;
  }
  return { code, name, scheme };
}

import { z } from "zod";
