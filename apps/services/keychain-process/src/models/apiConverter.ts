import type { ConsumerKeychain } from "@knodia/keychain-models";

import type { API_Keychain } from "./api.ts";

export const toAPI_Keychain = (keychain: ConsumerKeychain): API_Keychain => ({
  createdAt: keychain.createdAt.toISOString(),
  description: keychain.description,
  id: keychain.id,
  name: keychain.name,
  ownerId: keychain.ownerId,
  updatedAt: keychain.updatedAt.toISOString(),
});
