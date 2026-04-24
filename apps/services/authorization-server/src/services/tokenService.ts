import type { TokenGenerator } from "@knodia/token-generator";
import type { FastifyBaseLogger } from "fastify";

import { type ConsumerKeychainId } from "@knodia/common-models/ids";
import { type JtiReplayStore } from "@knodia/db-jti-replay-store";
import { type K2K2GatewayApiClient } from "@knodia/k2k-gateway-client";

import type { AuthorizationServerConfig } from "../config/config.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  assertDpopProofNotReplayed,
  validatePlatformObjects,
  verifyClientAssertionSignature,
  verifyDpopProofSignature,
} from "../utils/validators.ts";

export type TokenService = ReturnType<typeof tokenServiceBuilder>;
export function tokenServiceBuilder({
  config: {
    eserviceAccessTokenJwtKid,
    generatedEserviceAccessTokenIssuer,
    knodeId,
  },
  dpopProofStore,
  k2kGatewayClient,
  readmodelService,
  tokenGenerator,
}: {
  config: AuthorizationServerConfig;
  dpopProofStore: JtiReplayStore;
  k2kGatewayClient: K2K2GatewayApiClient;
  readmodelService: ReadmodelService;
  tokenGenerator: TokenGenerator;
}) {
  return {
    async issueToken(
      {
        clientAssertionJWS,
        consumerKeychainId,
        dpopProofJWS,
      }: {
        clientAssertionJWS: string;
        consumerKeychainId: ConsumerKeychainId;
        dpopProofJWS: string | undefined;
      },
      {
        clientAssertionAcceptedAudiences,
        clientAssertionClockToleranceSeconds,
        clientAssertionMaxTokenAgeSeconds,
        dpopProofHtuBaseUrl,
        dpopProofMaxTokenAgeSeconds,
      }: AuthorizationServerConfig,
      logger: FastifyBaseLogger,
    ) {
      // Verify DPoP proof signature and claims if a DPoP proof is provided in the Client Assertion header
      const dpopProofJWT = await verifyDpopProofSignature(
        dpopProofJWS,
        dpopProofMaxTokenAgeSeconds,
        dpopProofHtuBaseUrl,
        logger,
      );

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
          dpopProofJWT,
          readmodelService,
        );

      // Check that the DPoP proof has not been replayed if the request is using DPoP
      if (dpopProofJWT) {
        await assertDpopProofNotReplayed(
          dpopProofJWT,
          dpopProofMaxTokenAgeSeconds,
          dpopProofStore,
        );
      }

      // Generate the E-service access token
      const token = await tokenGenerator.generateEserviceAccessToken({
        audience: eserviceVersion.accessTokenAudience,
        consumer: purpose.consumer,
        consumerKeychainId,
        dpopJWK: dpopProofJWT?.header.jwk,
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
        token_type: dpopProofJWT ? ("DPoP" as const) : ("Bearer" as const),
      };
    },
  };
}
