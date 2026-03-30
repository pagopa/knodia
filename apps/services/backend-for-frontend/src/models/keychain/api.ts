import {
  API_Pagination,
  API_PaginationQueryParams,
  API_UserId,
} from "@knodia/common-models/api";
import {
  API_ConsumerKeychainIdPathParam,
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
    pagination: API_Pagination,
    results: z.array(API_Keychain),
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

export const API_ConsumerKeychainPatch = z
  .strictObject({
    description: API_KeychainLocalizedDescription.nullable().optional(),
    name: API_KeychainLocalizedName.optional(),
  })
  .meta({ id: "ConsumerKeychainPatch" });

export type API_ConsumerKeychainPatch = z.infer<
  typeof API_ConsumerKeychainPatch
>;

export const API_KeychainMemberSeed = z
  .strictObject({
    userId: API_UserId,
  })
  .meta({ id: "KeychainMemberSeed" });
export type API_KeychainMemberSeed = z.infer<typeof API_KeychainMemberSeed>;

export const API_ConsumerKeychainMemberPathParam = z
  .strictObject({
    userId: API_UserId,
  })
  .extend(API_ConsumerKeychainIdPathParam.shape);

export type API_ConsumerKeychainMemberPathParam = z.infer<
  typeof API_ConsumerKeychainMemberPathParam
>;

export const API_User = z
  .strictObject({
    email: z.string(),
    id: API_UserId,
    username: z.string(),
  })
  .meta({ id: "User" });
export type API_User = z.infer<typeof API_User>;

export const API_Users = z.array(API_User).meta({ id: "Users" });
export type API_Users = z.infer<typeof API_Users>;
