import type { TokenGenerator } from "@knodia/token-generator";
import type { FastifyBaseLogger } from "fastify";

import { type ConsumerKeychainId } from "@knodia/common-models/ids";
import { type K2K2GatewayApiClient } from "@knodia/k2k-gateway-client";

import type { AuthorizationServerConfig } from "../config/config.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  validatePlatformObjects,
  verifyClientAssertionSignature,
} from "../utils/validators.ts";

export type TokenService = ReturnType<typeof tokenServiceBuilder>;
export function tokenServiceBuilder({
  config: {
    eserviceAccessTokenJwtKid,
    generatedEserviceAccessTokenIssuer,
    knodeId,
  },
  k2kGatewayClient,
  readmodelService,
  tokenGenerator,
}: {
  config: AuthorizationServerConfig;
  k2kGatewayClient: K2K2GatewayApiClient;
  readmodelService: ReadmodelService;
  tokenGenerator: TokenGenerator;
}) {
  return {
    async issueToken(
      {
        clientAssertionJWS,
        consumerKeychainId,
      }: {
        clientAssertionJWS: string;
        consumerKeychainId: ConsumerKeychainId;
      },
      clientAssertionAcceptedAudiences: string[],
      clientAssertionClockToleranceSeconds: number,
      clientAssertionMaxTokenAgeSeconds: number,
      logger: FastifyBaseLogger,
    ) {
      // Verify Client Assertion signature and claims
      const { consumerAttributes, purposeId } =
        await verifyClientAssertionSignature(
          { clientAssertionJWS, consumerKeychainId },
          clientAssertionAcceptedAudiences,
          clientAssertionClockToleranceSeconds,
          clientAssertionMaxTokenAgeSeconds,
          k2kGatewayClient,
          logger,
        );

      // Check that the platform objects (agreement, e-service version, purpose) are in a consumable state and that the Consumer meets the E-service version required attributes
      const { agreement, eserviceVersion, purpose } =
        await validatePlatformObjects(
          purposeId,
          consumerAttributes,
          readmodelService,
        );

      // Generate the E-service access token
      const token = await tokenGenerator.generateEserviceAccessToken({
        audience: eserviceVersion.accessTokenAudience,
        consumer: purpose.consumer,
        consumerKeychainId,
        eserviceId: purpose.eserviceId,
        eserviceVersionId: eserviceVersion.id,
        issuer: generatedEserviceAccessTokenIssuer,
        kid: eserviceAccessTokenJwtKid,
        producer: { id: agreement.producerId, knodeId },
        purposeId: purpose.id,
        secondsDuration: eserviceVersion.accessTokenDuration,
        subject: consumerKeychainId,
      });

      return {
        access_token: token.serialized,
        expires_in: token.payload.exp - token.payload.iat,
        token_type: "Bearer" as const,
      };
    },
  };
}
