import type { K2K2GatewayApiClientFactory } from "@knodia/k2k-gateway-client/factory";
import type { TokenGenerator } from "@knodia/token-generator";
import type { FastifyBaseLogger } from "fastify";

import {
  type ConsumerKeychainId,
  type KnodeApiKeychainId,
} from "@knodia/common-models/ids";
import { type JtiReplayStore } from "@knodia/db-jti-replay-store";
import {
  assertDpopProofNotReplayed,
  verifyDpopProofSignature,
} from "@knodia/dpop-validator";

import type { AuthorizationServerConfig } from "../config/config.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import { EXPECTED_DPOP_PROOF_HTM } from "../models/constants.ts";
import {
  validatePlatformObjects,
  verifyClientAssertionSignature,
  verifyKnodeApiClientAssertionSignature,
} from "../utils/validators.ts";

export type TokenService = ReturnType<typeof tokenServiceBuilder>;
export function tokenServiceBuilder({
  config,
  dpopProofStore,
  getK2K2GatewayApiClient,
  readmodelService,
  tokenGenerator,
}: {
  config: AuthorizationServerConfig;
  dpopProofStore: JtiReplayStore;
  getK2K2GatewayApiClient: K2K2GatewayApiClientFactory;
  readmodelService: ReadmodelService;
  tokenGenerator: TokenGenerator;
}) {
  return {
    async issueEserviceAccessToken(
      {
        clientAssertionJWS,
        consumerKeychainId,
        dpopProofJWS,
      }: {
        clientAssertionJWS: string;
        consumerKeychainId: ConsumerKeychainId;
        dpopProofJWS: string | undefined;
      },
      logger: FastifyBaseLogger,
    ) {
      // Verify DPoP proof signature and claims if a DPoP proof is provided in the request headers
      const dpopProofJWT = await verifyDpopProofSignature(
        dpopProofJWS,
        {
          expectedHtm: EXPECTED_DPOP_PROOF_HTM,
          expectedHtu: config.dpopProofHtuBaseUrl,
          jwtClockToleranceSeconds: config.jwtClockToleranceSeconds,
          maxTokenAgeSeconds: config.dpopProofMaxTokenAgeSeconds,
        },
        logger,
      );

      // Verify Client Assertion signature and claims
      const { consumerAttributes, purpose } =
        await verifyClientAssertionSignature(
          { clientAssertionJWS, consumerKeychainId },
          config,
          getK2K2GatewayApiClient,
          readmodelService,
          logger,
        );

      // Check that the DPoP proof has not been replayed if the request is using DPoP
      if (dpopProofJWT) {
        await assertDpopProofNotReplayed(
          dpopProofJWT,
          config.dpopProofMaxTokenAgeSeconds,
          dpopProofStore,
          config.jwtClockToleranceSeconds,
        );
      }

      // Check that the platform objects (purpose, agreement, e-service version) are in a consumable state and that the Consumer meets the E-service version required attributes
      const { agreement, eserviceVersion } = await validatePlatformObjects(
        purpose.data,
        consumerAttributes,
        dpopProofJWT,
        readmodelService,
      );

      // Generate the E-service access token
      const token = await tokenGenerator.generateEserviceAccessToken({
        audience: eserviceVersion.accessTokenAudience,
        consumer: purpose.data.consumer,
        consumerKeychainId,
        dpopJWK: dpopProofJWT?.headers.jwk,
        eserviceId: purpose.data.eserviceId,
        eserviceVersionId: eserviceVersion.id,
        issuer: config.generatedEserviceAccessTokenIssuer,
        kid: config.eserviceAccessTokenJwtKid,
        producer: { id: agreement.producerId, knodeId: config.knodeId },
        purposeId: purpose.data.id,
        secondsDuration: eserviceVersion.accessTokenDuration,
        subject: consumerKeychainId,
      });

      return {
        access_token: token.serialized,
        expires_in: token.payload.exp - token.payload.iat,
        token_type: dpopProofJWT ? ("DPoP" as const) : ("Bearer" as const),
      };
    },

    async issueKnodeApiToken(
      {
        clientAssertionJWS,
        knodeApiKeychainId,
      }: {
        clientAssertionJWS: string;
        knodeApiKeychainId: KnodeApiKeychainId;
      },
      logger: FastifyBaseLogger,
    ) {
      const { keychainKnodeId, ownerId } =
        await verifyKnodeApiClientAssertionSignature(
          { clientAssertionJWS, knodeApiKeychainId },
          config,
          getK2K2GatewayApiClient,
          readmodelService,
          logger,
        );

      const token = await tokenGenerator.generateKnodeApiAccessToken({
        audience: [config.generatedKnodeApiTokenAudience],
        issuer: config.generatedKnodeApiTokenIssuer,
        keychain: { id: knodeApiKeychainId, knodeId: keychainKnodeId },
        kid: config.knodeApiTokenJwtKid,
        organization: { id: ownerId, knodeId: keychainKnodeId },
        secondsDuration: config.knodeApiTokenDurationSeconds,
      });

      return {
        access_token: token.serialized,
        expires_in: token.payload.exp - token.payload.iat,
        token_type: "Bearer" as const,
      };
    },
  };
}
