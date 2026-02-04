export interface Attribute {
  scheme: string;
  code: string;
  name: string;
}

export const attributes: Attribute[] = [
  {
    scheme: "vc_territorial_units",
    code: "nuts1",
    name: "NUTS 1",
  },
  {
    scheme: "vc_territorial_units",
    code: "nuts2",
    name: "NUTS 2",
  },
  {
    scheme: "vc_territorial_units",
    code: "nuts3",
    name: "NUTS 3",
  },
];
