import z from "zod";

export const HTTPServiceName = z.enum([
  "authorization-server",
  "backend-for-frontend",
  "eservice-process",
  "k2k-gateway",
  "mock-eservice",
  "remote-resources-manager",
  "agreement-process",
  "keychain-process",
  "organization-process",
  "purpose-process",
]);
export type HTTPServiceName = z.infer<typeof HTTPServiceName>;

/* eslint-disable perfectionist/sort-objects */
export const serviceErrorCode: Record<HTTPServiceName, string> = {
  "backend-for-frontend": "001",
  "eservice-process": "002",
  "k2k-gateway": "003",
  "remote-resources-manager": "004",
  "agreement-process": "005",
  "keychain-process": "006",
  "organization-process": "007",
  "purpose-process": "008",
  "authorization-server": "009",
  "mock-eservice": "999",
};
/* eslint-enable perfectionist/sort-objects */
