import {
  API_KeychainLocalizedDescription,
  API_KeychainLocalizedName,
} from "@knodia/keychain-models/api";
import z from "zod";

export const API_ConsumerKeychainSeed = z
  .strictObject({
    description: API_KeychainLocalizedDescription.optional(),
    name: API_KeychainLocalizedName,
  })
  .meta({ id: "ConsumerKeychainSeed" });
export type API_ConsumerKeychainSeed = z.infer<typeof API_ConsumerKeychainSeed>;
