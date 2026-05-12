import type { TokenGenerator } from "@knodia/token-generator";
import type { FastifyBaseLogger } from "fastify";

import {
  type KnodeApiKeychainId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { type K2K2GatewayApiClient } from "@knodia/k2k-gateway-client";

import type { AuthorizationServerConfig } from "../config/config.ts";

import { verifyKnodeApiClientAssertionSignature } from "../utils/knodeApiValidators.ts";

export type KnodeApiTokenService = ReturnType<typeof knodeApiTokenServiceBuilder>;
export function knodeApiTokenServiceBuilder({
  config: {
    generatedKnodeApiTokenAudience,
    generatedKnodeApiTokenIssuer,
    knodeApiTokenDurationSeconds,
    knodeApiTokenJwtKid,
  },
  knodeApiKeychainK2KGatewayClient,
  tokenGenerator,
}: {
  config: AuthorizationServerConfig;
  knodeApiKeychainK2KGatewayClient: K2K2GatewayApiClient;
  tokenGenerator: TokenGenerator;
}) {
  return {
    async issueKnodeApiToken(
      {
        clientAssertionJWS,
        knodeApiKeychainId,
      }: {
        clientAssertionJWS: string;
        knodeApiKeychainId: KnodeApiKeychainId;
      },
      {
        jwtClockToleranceSeconds,
        knodeApiClientAssertionAcceptedAudiences,
        knodeApiClientAssertionMaxTokenAgeSeconds,
      }: AuthorizationServerConfig,
      logger: FastifyBaseLogger,
    ) {
      const { keychainKnodeId, ownerId } =
        await verifyKnodeApiClientAssertionSignature(
          { clientAssertionJWS, knodeApiKeychainId },
          knodeApiClientAssertionAcceptedAudiences,
          jwtClockToleranceSeconds,
          knodeApiClientAssertionMaxTokenAgeSeconds,
          knodeApiKeychainK2KGatewayClient,
          logger,
        );

      const token = await tokenGenerator.generateKnodeApiAccessToken({
        audience: [generatedKnodeApiTokenAudience],
        issuer: generatedKnodeApiTokenIssuer,
        keychain: { id: knodeApiKeychainId, knodeId: keychainKnodeId },
        kid: knodeApiTokenJwtKid,
        organization: {
          id: unsafeBrandId<OrganizationId>(ownerId),
          knodeId: keychainKnodeId,
        },
        secondsDuration: knodeApiTokenDurationSeconds,
      });

      return {
        access_token: token.serialized,
        expires_in: token.payload.exp - token.payload.iat,
        token_type: "Bearer" as const,
      };
    },
  };
}
