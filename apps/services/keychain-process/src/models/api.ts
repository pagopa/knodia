import {
  API_OrganizationId,
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import {
  API_KeychainLocalizedDescription,
  API_KeychainLocalizedName,
} from "@knodia/keychain-models/api";
import { z } from "zod";

const API_KeychainId = z
  .uuid()
  .meta({ description: "Unique identifier of the Keychain", id: "KeychainId" });

export const API_Keychain = z
  .strictObject({
    createdAt: z.iso.datetime(),
    description: API_KeychainLocalizedDescription.optional(),
    id: API_KeychainId,
    name: API_KeychainLocalizedName,
    ownerId: API_OrganizationId,
    updatedAt: z.iso.datetime(),
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

export const API_GetConsumerKeychainsQueryParams = API_PaginationQueryParams;
export type API_GetConsumerKeychainsQueryParams = z.infer<
  typeof API_GetConsumerKeychainsQueryParams
>;

export const API_ConsumerKeychainSeed = z
  .strictObject({
    description: API_KeychainLocalizedDescription.optional(),
    name: API_KeychainLocalizedName,
  })
  .meta({ id: "ConsumerKeychainSeed" });
export type API_ConsumerKeychainSeed = z.infer<typeof API_ConsumerKeychainSeed>;

export const API_ConsumerKeychainPatch = z
  .strictObject({
    description: API_KeychainLocalizedDescription.nullable().optional(),
    name: API_KeychainLocalizedName.optional(),
  })
  .meta({ id: "ConsumerKeychainPatch" });
export type API_ConsumerKeychainPatch = z.infer<
  typeof API_ConsumerKeychainPatch
>;

export const API_User = z
  .strictObject({
    email: z.string(),
    id: z.uuid(),
    username: z.string(),
  })
  .meta({ id: "User" });
export type API_User = z.infer<typeof API_User>;

export const API_Users = z.array(API_User).meta({ id: "Users" });
export type API_Users = z.infer<typeof API_Users>;
