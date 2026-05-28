import type { ExternalId } from "@knodia/common-models/externalResource";
import type { KnodeId, OrganizationId } from "@knodia/common-models/ids";
import type {
  ExternalUISessionAuthData,
  UISessionAuthData,
} from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { K2K2GatewayApiClientFactory } from "@knodia/k2k-gateway-client/factory";

import { k2kGatewayApi } from "@knodia/k2k-gateway-client";

import type {
  API_GetOrganizationsQueryParams,
  API_Organization,
  API_Organizations,
} from "../models/organization/api.ts";

import { toAPI_Organization } from "../models/organization/apiConverter.ts";
import { assertTokenRemoteOrganizationClaimsMatchRequest } from "../utils/validators.ts";

export type OrganizationService = ReturnType<typeof organizationServiceBuilder>;

export function organizationServiceBuilder(
  getK2K2GatewayApiClient: K2K2GatewayApiClientFactory,
) {
  return {
    async getOrganization(
      organizationId: ExternalId<OrganizationId>,
      targetKnodeId: KnodeId,
      {
        authData,
        logger,
      }: AuthorizedContext<ExternalUISessionAuthData | UISessionAuthData>,
    ): Promise<API_Organization> {
      logger.info(
        `Getting Organization ${organizationId} from Knode ${targetKnodeId}`,
      );

      if (authData.tokenType === "external-ui-session") {
        assertTokenRemoteOrganizationClaimsMatchRequest(
          authData,
          organizationId,
          targetKnodeId,
        );
      }

      const { data } = await k2kGatewayApi.getOrganization({
        client: getK2K2GatewayApiClient(targetKnodeId),
        path: { organizationId },
      });

      return toAPI_Organization(data);
    },
    async getOrganizations(
      requestQuery: API_GetOrganizationsQueryParams,
      { logger }: AuthorizedContext<UISessionAuthData>,
    ): Promise<API_Organizations> {
      const { knodeId: targetKnodeId, ...queryWithoutKnodeId } = requestQuery;
      logger.info({
        message: `Getting Organizations from Knode ${targetKnodeId} with query`,
        requestQuery,
      });

      const { data } = await k2kGatewayApi.getOrganizations({
        client: getK2K2GatewayApiClient(targetKnodeId),
        query: queryWithoutKnodeId,
      });

      return {
        pagination: data.pagination,
        results: data.results.map(toAPI_Organization),
      };
    },
  };
}
