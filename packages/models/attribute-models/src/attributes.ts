interface Attribute {
  code: string;
  name: string;
  scheme: string;
}

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
): Attribute | undefined {
  const name = attributes[scheme]?.[code];
  if (name === undefined) {
    return undefined;
  }
  return { code, name, scheme };
}
