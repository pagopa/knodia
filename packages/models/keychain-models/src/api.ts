import { ExternalId } from "@knodia/common-models/externalResource";
import { ConsumerKeychainId, type PurposeId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import {
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
} from "./keychain.ts";

export const API_KeychainId = z
  .uuid()
  .meta({ description: "Unique identifier of the Keychain", id: "KeychainId" });

export const API_ConsumerKeychainIdPathParam = z.strictObject({
  consumerKeychainId: ConsumerKeychainId,
});
export type API_ConsumerKeychainIdPathParam = z.infer<
  typeof API_ConsumerKeychainIdPathParam
>;

export const API_KeychainLocalizedName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({ description: "Name of the Keychain", id: "KeychainLocalizedName" });
export type API_KeychainLocalizedName = z.infer<
  typeof API_KeychainLocalizedName
>;

export const API_KeychainLocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
).meta({
  description: "Description of the Keychain",
  id: "KeychainLocalizedDescription",
});
export type API_KeychainLocalizedDescription = z.infer<
  typeof API_KeychainLocalizedDescription
>;

/** @knipignore -  Will be used when implementing the keychain keys lifecycle */
export const API_KeyFormat = z.enum(["jwk", "x509"]).meta({ id: "KeyFormat" });
export type API_KeyFormat = z.infer<typeof API_KeyFormat>;

export const API_ConsumerKeychainPurposeLinkSeed = z
  .strictObject({
    knodeId: API_KnodeId,
    purposeId: z.uuid(),
  })
  .meta({ id: "ConsumerKeychainPurposeLinkSeed" });
export type API_ConsumerKeychainPurposeLinkSeed = z.infer<
  typeof API_ConsumerKeychainPurposeLinkSeed
>;

export const API_UnlinkConsumerKeychainPurposeQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_UnlinkConsumerKeychainPurposeQueryParams = z.infer<
  typeof API_UnlinkConsumerKeychainPurposeQueryParams
>;

export const API_UnlinkConsumerKeychainIdPathParam =
  API_ConsumerKeychainIdPathParam.extend({
    purposeId: ExternalId<PurposeId>(),
  });
export type API_UnlinkConsumerKeychainIdPathParam = z.infer<
  typeof API_UnlinkConsumerKeychainIdPathParam
>;
