import type { API_TokenRequest } from "../models/api.ts";

import { validateClientAssertionClaims } from "../utils/validators.ts";

export function tokenServiceBuilder() {
  return {
    async issueToken(requestBody: API_TokenRequest) {
      // Client assertion claims validation
      validateClientAssertionClaims(requestBody);

      // TODO: call k2k-gateway to get the public key
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
