import type { Keychain } from "@knodia/keychain-models";

import type { API_Keychain } from "./api.ts";

export const toAPI_Keychain = (keychain: Keychain): API_Keychain => ({
  description: keychain.description,
  id: keychain.id,
  kind: keychain.kind,
  name: keychain.name,
  ownerId: keychain.ownerId,
  updatedAt: keychain.updatedAt.toISOString(),
});
