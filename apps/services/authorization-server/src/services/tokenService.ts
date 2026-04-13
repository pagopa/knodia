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

export function tokenServiceBuilder(
  k2kGatewayClient: K2K2GatewayApiClient,
  readmodelService: ReadmodelService,
) {
  return {
    async issueToken(requestBody: API_TokenRequest) {
      // Client assertion claims validation
      const clientAssertion = validateClientAssertionClaims(requestBody);

      // Get access token data from the external Knode through the K2K2Gateway API
      const {
        data: { consumerAttributes, publicKey },
      } = await k2kGatewayApi.getAccessTokenData({
        body: {
          kid: clientAssertion.header.kid,
          purposeId: clientAssertion.payload.purpose_id,
        },
        client: k2kGatewayClient,
        path: {
          keychainId: requestBody.consumer_keychain_id,
        },
      });

      await verifyClientAssertionSignature(
        requestBody.client_assertion,
        publicKey,
        clientAssertion.header.alg,
      );

      await validatePlatformObjects(
        clientAssertion.payload.purpose_id,
        clientAssertion.payload.aud,
        consumerAttributes,
        readmodelService,
      );

      // TODO: generate token

      // TODO remove this mock implementation when the authorization server issues real tokens.
      return {
        mockAccessToken: "mock-access-token",
      };
    },
  };
}
