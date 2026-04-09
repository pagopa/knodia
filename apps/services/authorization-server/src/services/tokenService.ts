import type { API_TokenRequest } from "../models/api.ts";

import { tokenRequestValidationError } from "../models/errors.ts";
import { validateRequestParameters } from "../utils/validation.ts";

export function tokenServiceBuilder() {
  return {
    async issueToken(requestBody: API_TokenRequest) {
      // Request body parameters validation
      const { errors: parametersErrors } = validateRequestParameters({
        client_assertion: requestBody.client_assertion,
        client_assertion_type: requestBody.client_assertion_type,
        consumer_keychain_id: requestBody.consumer_keychain_id,
        grant_type: requestBody.grant_type,
      });

      if (parametersErrors) {
        throw tokenRequestValidationError(
          requestBody.consumer_keychain_id,
          parametersErrors,
        );
      }

      // TODO: verify client assertion claims + eservice audience
      // TODO: call k2k-gateway to get the public key
      // TODO: verify client assertion signature with the retrieved public key
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
