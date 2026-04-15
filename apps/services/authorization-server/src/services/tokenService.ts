import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";

import type { API_TokenRequest } from "../models/api.ts";

import { validateClientAssertionClaims } from "../utils/validators.ts";

export function tokenServiceBuilder(k2kGatewayClient: K2K2GatewayApiClient) {
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

      // Get access token data from the external Knode through the k2k-gateway API
      await k2kGatewayApi.getClientAssertionVerificationData({
        body: {
          keychainId: requestBody.client_id,
          kid: clientAssertion.header.kid,
          purposeId: clientAssertion.payload.purposeId,
        },
        client: k2kGatewayClient,
      });

      // TODO: verify client assertion signature with the consumer keychain public key
      // TODO: verify platform states (agreement, purpose and eservice version must be active)
      // TODO: verify consumer attributes meet the eservice required attributes
      // TODO: generate token

      // TODO remove this mock implementation when the authorization server issues real tokens.
      return {
        mockAccessToken: "mock-access-token",
      };
    },
  };
}
