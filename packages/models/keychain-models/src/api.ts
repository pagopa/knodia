import { API_KeyId, API_UserId } from "@knodia/common-models/api";
import { ExternalId } from "@knodia/common-models/externalResource";
import {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  ProducerKeychainId,
  type PurposeId,
} from "@knodia/common-models/ids";
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

export const API_KnodeApiKeychainIdPathParam = z.strictObject({
  knodeApiKeychainId: KnodeApiKeychainId,
});
export type API_KnodeApiKeychainIdPathParam = z.infer<
  typeof API_KnodeApiKeychainIdPathParam
>;

export const API_KeychainLocalizedName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({ description: "Name of the Keychain", id: "KeychainLocalizedName" });
export type API_KeychainLocalizedName = z.infer<
  typeof API_KeychainLocalizedName
>;

export const API_KeychainKeyLocalizedName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({
  description: "Name of the Keychain Key",
  id: "KeychainKeyLocalizedName",
});
export type API_KeychainKeyLocalizedName = z.infer<
  typeof API_KeychainKeyLocalizedName
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

export const API_KeyFormat = z
  .enum(["PublicKey", "X509Certificate"])
  .meta({ id: "KeyFormat" });
export type API_KeyFormat = z.infer<typeof API_KeyFormat>;

export const API_KeyAlgorithm = z.enum(["RS256"]).meta({ id: "KeyAlgorithm" });
export type API_KeyAlgorithm = z.infer<typeof API_KeyAlgorithm>;

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

export const API_UnlinkConsumerKeychainIdPathParams =
  API_ConsumerKeychainIdPathParam.extend({
    purposeId: ExternalId<PurposeId>(),
  });
export type API_UnlinkConsumerKeychainIdPathParams = z.infer<
  typeof API_UnlinkConsumerKeychainIdPathParams
>;

export const API_ProducerKeychainIdPathParam = z.strictObject({
  producerKeychainId: ProducerKeychainId,
});
export type API_ProducerKeychainIdPathParam = z.infer<
  typeof API_ProducerKeychainIdPathParam
>;

export const API_ProducerKeychainEserviceLinkSeed = z
  .strictObject({
    eserviceId: z.uuid(),
  })
  .meta({ id: "ProducerKeychainEserviceLinkSeed" });
export type API_ProducerKeychainEserviceLinkSeed = z.infer<
  typeof API_ProducerKeychainEserviceLinkSeed
>;

export const API_CreatedMemberResource = z
  .strictObject({
    userId: API_UserId,
  })
  .meta({
    description: "Unique identifier of the created member resource",
    id: "CreatedMemberResource",
  });
export type API_CreatedMemberResource = z.infer<
  typeof API_CreatedMemberResource
>;

export const API_KeyIdPathParam = z.strictObject({
  keyId: API_KeyId,
});
export type API_KeyIdPathParam = z.infer<typeof API_KeyIdPathParam>;

export const API_PublicKey = z
  .strictObject({
    algorithm: API_KeyAlgorithm,
    encodedPem: z.string(),
    format: API_KeyFormat,
    kid: API_KeyId,
  })
  .meta({ description: "Public Key details", id: "PublicKey" });
export type API_PublicKey = z.infer<typeof API_PublicKey>;
