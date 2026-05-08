import type { CognitoIdmClient, IdmUser } from "@knodia/cognito-idm-client";
import type { UISessionAuthData } from "@knodia/fastify-zod-api-commons/auth";
import type { AuthorizedContext } from "@knodia/fastify-zod-api-commons/context";

export type OperatorService = ReturnType<typeof operatorServiceBuilder>;

export function operatorServiceBuilder(cognitoIdmClient: CognitoIdmClient) {
  return {
    async getOperators({
      authData,
      logger,
    }: AuthorizedContext<UISessionAuthData>): Promise<IdmUser[]> {
      logger.info("Getting Operators of the requesting Organization");

      return await cognitoIdmClient.getOrganizationUsers(
        authData.organizationId,
      );
    },
  };
}
