import type { keychainProcessApi } from "@knodia/keychain-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";

import type { API_ClientAssertionVerificationResponse } from "./api.ts";

export function toAPI_ClientAssertionVerificationResponse(
  key: keychainProcessApi.KeychainKey,
  organization: organizationProcessApi.Organization,
): API_ClientAssertionVerificationResponse {
  return {
    consumerAttributes: organization.attributes,
    publicKey: {
      algorithm: key.algorithm,
      encodedPem: key.encodedPem,
      format: key.format,
      kid: key.kid,
    },
  };
}
