import { type K2K2GatewayApiClient } from "@knodia/k2k-gateway-client";

import type { API_TokenRequest } from "../models/api.ts";

import { verifyClientAssertionSignature } from "../utils/validators.ts";

export function tokenServiceBuilder(k2kGatewayClient: K2K2GatewayApiClient) {
  return {
    async issueToken(
      requestBody: API_TokenRequest,
      clientAssertionAcceptedAudiences: string[],
      clientAssertionClockToleranceSeconds: number,
      clientAssertionMaxTokenAgeSeconds: number,
    ) {
      // Verify Client Assertion signature and claims
      await verifyClientAssertionSignature(
        requestBody,
        clientAssertionAcceptedAudiences,
        clientAssertionClockToleranceSeconds,
        clientAssertionMaxTokenAgeSeconds,
        k2kGatewayClient,
      );

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
