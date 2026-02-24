import { unsafeBrandId } from "@knodia/common-models/ids";

import type { ConsumptionEserviceDetail } from "./consumption-eservice-detail";

export const mockConsumptionEserviceDetail: ConsumptionEserviceDetail = {
  accessToken: {
    audience: "www.ursa.lynx/birth/v1",
    duration: 30,
    type: "DPoP",
  },
  categories: [
    { code: "birth-place", scheme: "eu-categories" },
    { code: "birth-date", scheme: "eu-categories" },
  ],
  description:
    "This E-Service provides certified proof of registration of birth, enabling cross-border verification of birth records between EU member states in compliance with the Single Digital Gateway regulation.",
  hasRequiredAttributes: true,
  id: unsafeBrandId("f47ac10b-58cc-4372-a567-0e02b2c3d479"),
  identificationRequired: false,
  interfaceDocument: {
    checksum:
      "3f653f35f8311c870e209cc672dfc3698081eefe84cc40f1af5bd61db2c54287",
    name: "API Specs",
  },
  isSignalHubEnabled: false,
  maxDailyCalls: {
    perConsumer: 1000,
    perKnode: 10000,
  },
  mode: "ProvideData",
  name: "Requesting proof of registration of birth",
  producer: {
    initials: "UR",
    name: "Ursa",
  },
  requiredAttributes: [
    [
      { code: "NUTS3", scheme: "eu" },
      { code: "NUTS0", scheme: "eu" },
    ],
  ],
  state: "Active",
};
