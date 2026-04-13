import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type { API_TokenRequest } from "../models/api.ts";

import { validateClientAssertionClaims } from "../utils/validators.ts";

export function tokenServiceBuilder(k2kGatewayClient: K2K2GatewayApiClient) {
  return {
    async issueToken(requestBody: API_TokenRequest) {
      // Client assertion claims validation
      const clientAssertion = validateClientAssertionClaims(requestBody);

      // Get access token data from the external Knode through the K2K2Gateway API
      await k2kGatewayApi.getAccessTokenData({
        body: {
          kid: clientAssertion.header.kid,
          purposeId: clientAssertion.payload.purpose_id,
        },
        client: k2kGatewayClient,
        path: {
          keychainId: requestBody.consumer_keychain_id,
        },
      });

      // TODO: verify client assertion signature with the retrieved public key
      // TODO: verify platform states (agreement, purpose and eservice version must be active)
      // TODO: verify consumer attributes meet the eservice required attributes and
      //  the client assertion audience claim must match the expected audience value based on the eservice version data
      // TODO: generate token

      // TODO remove this mock implementation when the authorization server issues real tokens.
      return {
        mockAccessToken: "mock-access-token",
      };
    },
  };
}
