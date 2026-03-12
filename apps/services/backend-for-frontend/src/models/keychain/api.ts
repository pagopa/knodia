import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
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

export const API_Keychain = z
  .strictObject({
    id: z.uuid(),
    keysCount: z.number().int().min(0).meta({ format: "int32" }),
    membersCount: z.number().int().min(0).meta({ format: "int32" }),
    name: API_KeychainLocalizedName,
  })
  .meta({ id: "Keychain" });
export type API_Keychain = z.infer<typeof API_Keychain>;

export const API_Keychains = z
  .strictObject({
    items: z.array(API_Keychain),
    pagination: API_Pagination,
  })
  .meta({ id: "Keychains" });
export type API_Keychains = z.infer<typeof API_Keychains>;

export const API_KeychainDetails = z
  .strictObject({
    createdAt: z.iso.datetime(),
    description: API_KeychainLocalizedDescription.optional(),
    id: z.uuid(),
    name: API_KeychainLocalizedName,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "KeychainDetails" });
export type API_KeychainDetails = z.infer<typeof API_KeychainDetails>;

export const API_ConsumerKeychainsQueryParams = API_PaginationQueryParams;
export type API_ConsumerKeychainsQueryParams = z.infer<
  typeof API_ConsumerKeychainsQueryParams
>;
