import { ConsumerKeychainId } from "@knodia/common-models/ids";
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

const API_ConsumerKeychainLinkedPurpose = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "ConsumerKeychainLinkedPurpose" });

export const API_ConsumerKeychainPurpose = z
  .strictObject({
    consumerKeychainId: API_KeychainId,
    linkedAt: z.iso.datetime(),
    purpose: API_ConsumerKeychainLinkedPurpose,
  })
  .meta({ id: "ConsumerKeychainPurpose" });
export type API_ConsumerKeychainPurpose = z.infer<
  typeof API_ConsumerKeychainPurpose
>;
