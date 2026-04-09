import type { keychainProcessApi } from "@knodia/keychain-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";

import type { API_AccessTokenDataResponse } from "./api.ts";

export function toAPI_AccessTokenDataResponse(
  key: keychainProcessApi.KeychainKey,
  organization: organizationProcessApi.Organization,
): API_AccessTokenDataResponse {
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
