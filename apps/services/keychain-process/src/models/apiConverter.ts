import type {
  ConsumerKeychainPurpose,
  FlatConsumerKeychain,
} from "@knodia/keychain-models";

import type { API_ConsumerKeychainPurpose, API_Keychain } from "./api.ts";

export const toAPI_Keychain = (
  keychain: FlatConsumerKeychain,
): API_Keychain => ({
  createdAt: keychain.createdAt.toISOString(),
  description: keychain.description,
  id: keychain.id,
  name: keychain.name,
  ownerId: keychain.ownerId,
  updatedAt: keychain.updatedAt.toISOString(),
});

export const toAPI_ConsumerKeychainPurpose = (
  consumerKeychainPurpose: ConsumerKeychainPurpose,
): API_ConsumerKeychainPurpose => ({
  consumerKeychainId: consumerKeychainPurpose.consumerKeychainId,
  linkedAt: consumerKeychainPurpose.linkedAt.toISOString(),
  purposeId: consumerKeychainPurpose.purposeId,
});
