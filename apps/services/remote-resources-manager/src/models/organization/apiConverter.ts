import type { API_KnodeId } from "@knodia/common-models/internalApi";
import type { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type { API_Organization } from "./api.ts";

export function toAPI_Organization(
  organization: k2kGatewayApi.Organization,
  knodeId: API_KnodeId,
): API_Organization {
  return {
    attributes: organization.attributes,
    id: organization.id,
    knodeId,
    name: organization.name,
  };
}
