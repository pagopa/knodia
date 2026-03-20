import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type { API_Organization } from "./api.ts";

export function toAPI_Organization(
  organization: k2kGatewayApi.Organization,
): API_Organization {
  return {
    attributes: organization.attributes,
    id: organization.id,
    name: organization.name,
  };
}
