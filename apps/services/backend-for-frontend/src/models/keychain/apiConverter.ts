import type { keychainProcessApi } from "@knodia/keychain-process-client";

import type { API_Keychain, API_KeychainDetails } from "./api.ts";

export const toAPI_KeychainDetails = (
  keychain: keychainProcessApi.Keychain,
): API_KeychainDetails => ({
  createdAt: keychain.createdAt,
  description: keychain.description,
  id: keychain.id,
  name: keychain.name,
  updatedAt: keychain.updatedAt,
});

export const toAPI_Keychain = (
  keychain: keychainProcessApi.Keychain,
  counters: { keysCount: number; membersCount: number },
): API_Keychain => ({
  id: keychain.id,
  keysCount: counters.keysCount,
  membersCount: counters.membersCount,
  name: keychain.name,
});
