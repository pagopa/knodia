import type { HTTPServiceName } from "@knodia/common-models/services";

/* eslint-disable perfectionist/sort-objects */
export const serviceErrorCode: Record<HTTPServiceName, string> = {
  "backend-for-frontend": "001",
  "eservice-process": "002",
  "k2k-gateway": "003",
  "remote-resources-manager": "004",
  "agreement-process": "005",
};
/* eslint-enable perfectionist/sort-objects */
