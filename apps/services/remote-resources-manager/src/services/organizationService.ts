import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type { API_Organization } from "../models/organization/api.ts";

import { toAPI_Organization } from "../models/organization/apiConverter.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
) {
  return {
    async getOrganization(
      organizationId: ExternalId<OrganizationId>,
      knodeId: KnodeId,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Organization> {
      logger.info(
        `Getting Organization ${organizationId} from Knode ${knodeId}`,
      );

      const { data } = await k2kGatewayApi.getOrganization({
        client: k2kGatewayClient,
        path: { organizationId },
      });

      return toAPI_Organization(data);
    },
  };
}
