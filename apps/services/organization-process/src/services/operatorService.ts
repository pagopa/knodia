import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";
import type { IdmClient, IdmUser } from "@knodia/idm-client";

export type OperatorService = ReturnType<typeof operatorServiceBuilder>;

export function operatorServiceBuilder(idmClient: IdmClient) {
  return {
    async getOperators({
      authData,
      logger,
    }: AuthorizedContext<UISessionAuthData>): Promise<IdmUser[]> {
      logger.info("Getting Operators of the requesting Organization");

      return await idmClient.getOrganizationUsers(authData.organizationId);
    },
  };
}
