import { ExternalResource } from "@knodia/common-models/externalResource";
import {
  ConsumerKeychainId,
  KeyId,
  KnodiaApiKeychainId,
  OrganizationId,
  type PurposeId,
  UserId,
} from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import { z } from "zod";

export const maxNameLength = 60;
export const minNameLength = 5;

export const maxDescriptionLength = 250;
export const minDescriptionLength = 10;

export const LocalizedName = LocalizedText(minNameLength, maxNameLength);
export type LocalizedName = z.infer<typeof LocalizedName>;

export const LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
);
export type LocalizedDescription = z.infer<typeof LocalizedDescription>;

export const KeyFormat = z.enum(["PublicKey", "X509Certificate"]);
export type KeyFormat = z.infer<typeof KeyFormat>;

export const KeyAlgorithm = z.enum(["RS256"]);
export type KeyAlgorithm = z.infer<typeof KeyAlgorithm>;

export const ConsumerKeychainKey = z.strictObject({
  algorithm: KeyAlgorithm,
  createdAt: z.coerce.date(),
  encodedPem: z.string(),
  format: KeyFormat,
  kid: KeyId,
  name: LocalizedName,
  userId: UserId,
});
export type ConsumerKeychainKey = z.infer<typeof ConsumerKeychainKey>;

export const ConsumerKeychainUser = z.strictObject({
  addedAt: z.coerce.date(),
  userId: UserId,
});
export type ConsumerKeychainUser = z.infer<typeof ConsumerKeychainUser>;

export const ConsumerKeychain = z.strictObject({
  createdAt: z.coerce.date(),
  description: LocalizedDescription.optional(),
  id: ConsumerKeychainId,
  keys: z.array(ConsumerKeychainKey),
  name: LocalizedName,
  ownerId: OrganizationId,
  updatedAt: z.coerce.date(),
  users: z.array(ConsumerKeychainUser),
});
export type ConsumerKeychain = z.infer<typeof ConsumerKeychain>;

export const FlatConsumerKeychain = ConsumerKeychain.omit({
  keys: true,
  users: true,
});
export type FlatConsumerKeychain = z.infer<typeof FlatConsumerKeychain>;

export const ConsumerKeychainPurpose = z.strictObject({
  consumerKeychainId: ConsumerKeychainId,
  linkedAt: z.coerce.date(),
  purpose: ExternalResource<PurposeId>(),
});
export type ConsumerKeychainPurpose = z.infer<typeof ConsumerKeychainPurpose>;

export const KnodiaApiKeychainKey = z.strictObject({
  algorithm: KeyAlgorithm,
  createdAt: z.coerce.date(),
  encodedPem: z.string(),
  format: KeyFormat,
  kid: KeyId,
  name: LocalizedName,
  userId: UserId,
});
export type KnodiaApiKeychainKey = z.infer<typeof KnodiaApiKeychainKey>;

export const KnodiaApiKeychainUser = z.strictObject({
  addedAt: z.coerce.date(),
  userId: UserId,
});
export type KnodiaApiKeychainUser = z.infer<typeof KnodiaApiKeychainUser>;

export const KnodiaApiKeychain = z.strictObject({
  createdAt: z.coerce.date(),
  description: LocalizedDescription.optional(),
  id: KnodiaApiKeychainId,
  keys: z.array(KnodiaApiKeychainKey),
  name: LocalizedName,
  ownerId: OrganizationId,
  updatedAt: z.coerce.date(),
  users: z.array(KnodiaApiKeychainUser),
});
export type KnodiaApiKeychain = z.infer<typeof KnodiaApiKeychain>;

export const FlatKnodiaApiKeychain = KnodiaApiKeychain.omit({
  keys: true,
  users: true,
});
export type FlatKnodiaApiKeychain = z.infer<typeof FlatKnodiaApiKeychain>;
