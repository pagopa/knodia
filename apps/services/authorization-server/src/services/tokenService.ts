import type { TokenGenerator } from "@knodia/token-generator";

import { unsafeBrandId } from "@knodia/common-models/ids";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type { API_TokenRequest } from "../models/api.ts";
import type { ReadmodelService } from "./readmodelService.ts";

import {
  validateClientAssertionClaims,
  validatePlatformObjects,
  verifyClientAssertionSignature,
} from "../utils/validators.ts";

export function tokenServiceBuilder({
  eserviceAccessTokenJwtKid,
  generatedEserviceAccessTokenIssuer,
  k2kGatewayClient,
  readmodelService,
  tokenGenerator,
}: {
  eserviceAccessTokenJwtKid: string;
  generatedEserviceAccessTokenIssuer: string;
  k2kGatewayClient: K2K2GatewayApiClient;
  readmodelService: ReadmodelService;
  tokenGenerator: TokenGenerator;
}) {
  return {
    async issueToken(
      requestBody: API_TokenRequest,
      clientAssertionAcceptedAudiences: string[],
    ) {
      // Client assertion claims validation
      const clientAssertion = validateClientAssertionClaims(
        requestBody,
        clientAssertionAcceptedAudiences,
      );

      // Get access token data from the external Knode through the K2K2Gateway API
      const {
        data: { consumerAttributes, publicKey },
      } = await k2kGatewayApi.getAccessTokenData({
        body: {
          kid: clientAssertion.header.kid,
          purposeId: clientAssertion.payload.purposeId,
        },
        client: k2kGatewayClient,
        path: {
          keychainId: requestBody.client_id,
        },
      });

      await verifyClientAssertionSignature(
        requestBody.client_assertion,
        publicKey,
        clientAssertion.header.alg,
      );

      const { agreement, eserviceVersion, purpose } =
        await validatePlatformObjects(
          clientAssertion.payload.purposeId,
          consumerAttributes,
          readmodelService,
        );

      const token = await tokenGenerator.generateEserviceAccessToken({
        audience: eserviceVersion.accessTokenAudience.join(","),
        consumer: purpose.consumer,
        consumerKeychainId: unsafeBrandId(requestBody.client_id),
        eserviceId: purpose.eserviceId,
        eserviceVersionId: eserviceVersion.id,
        issuer: generatedEserviceAccessTokenIssuer,
        kid: eserviceAccessTokenJwtKid,
        producerId: agreement.producerId,
        purposeId: purpose.id,
        secondsDuration: eserviceVersion.accessTokenDuration,
        subject: clientAssertion.payload.sub,
      });

      return {
        access_token: token.serialized,
        expires_in: token.payload.exp - token.payload.iat,
        token_type: "Bearer" as const,
      };
    },
  };
}
