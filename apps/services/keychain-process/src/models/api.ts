import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import {
  API_LocalizedDescription,
  API_LocalizedName,
} from "@knodia/keychain-models/api";
import { z } from "zod";

const API_KeychainId = z
  .uuid()
  .meta({ description: "Unique identifier of the Keychain", id: "KeychainId" });

const API_OwnerId = z.uuid().meta({
  description: "Unique identifier of the keychain owner",
  id: "OwnerId",
});

export const API_Keychain = z
  .strictObject({
    description: API_LocalizedDescription.optional(),
    id: API_KeychainId,
    name: API_LocalizedName,
    ownerId: API_OwnerId,
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
