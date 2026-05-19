import type { keychainProcessApi } from "@knodia/keychain-process-client";
import type { organizationProcessApi } from "@knodia/organization-process-client";

import type {
  API_ConsumerClientAssertionVerificationResponse,
  API_KnodeApiClientAssertionVerificationResponse,
} from "./api.ts";

export function toAPI_ConsumerClientAssertionVerificationResponse(
  key: keychainProcessApi.KeychainKey,
  organization: organizationProcessApi.Organization,
): API_ConsumerClientAssertionVerificationResponse {
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

export function toAPI_KnodeApiClientAssertionVerificationResponse(
  key: keychainProcessApi.KeychainKey,
  keychain: keychainProcessApi.Keychain,
): API_KnodeApiClientAssertionVerificationResponse {
  return {
    ownerId: keychain.ownerId,
    publicKey: {
      algorithm: key.algorithm,
      encodedPem: key.encodedPem,
      format: key.format,
      kid: key.kid,
    },
  };
}
