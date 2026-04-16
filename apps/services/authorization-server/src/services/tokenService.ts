import type { TokenGenerator } from "@knodia/token-generator";

import {
  type ConsumerKeychainId,
  type KnodeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { type K2K2GatewayApiClient } from "@knodia/k2k-gateway-client";

import type { API_TokenRequest } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  validatePlatformObjects,
  verifyClientAssertionSignature,
} from "../utils/validators.ts";

export type TokenService = ReturnType<typeof tokenServiceBuilder>;
export function tokenServiceBuilder({
  eserviceAccessTokenJwtKid,
  generatedEserviceAccessTokenIssuer,
  k2kGatewayClient,
  knodeId,
  readmodelService,
  tokenGenerator,
}: {
  eserviceAccessTokenJwtKid: string;
  generatedEserviceAccessTokenIssuer: string;
  k2kGatewayClient: K2K2GatewayApiClient;
  knodeId: KnodeId;
  readmodelService: ReadmodelService;
  tokenGenerator: TokenGenerator;
}) {
  return {
    async issueToken(
      requestBody: API_TokenRequest,
      clientAssertionAcceptedAudiences: string[],
      clientAssertionClockToleranceSeconds: number,
      clientAssertionMaxTokenAgeSeconds: number,
    ) {
      // Verify Client Assertion signature and claims
      const { consumerAttributes, purposeId } =
        await verifyClientAssertionSignature(
          requestBody,
          clientAssertionAcceptedAudiences,
          clientAssertionClockToleranceSeconds,
          clientAssertionMaxTokenAgeSeconds,
          k2kGatewayClient,
        );

      // Check that the platform objects (agreement, e-service version, purpose) are in Active state and that the Consumer meets the E-service version required attributes
      const { agreement, eserviceVersion, purpose } =
        await validatePlatformObjects(
          purposeId,
          consumerAttributes,
          readmodelService,
        );

      // Generate the E-service access token
      const consumerKeychainId = unsafeBrandId<ConsumerKeychainId>(
        requestBody.client_id,
      );
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
