import {
  ConsumerKeychainId,
  OrganizationId,
  PurposeId,
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

export const KeyFormat = z.enum(["jwk", "x509"]);
export type KeyFormat = z.infer<typeof KeyFormat>;

export const KeyAlgorithm = z.enum(["RS256"]);
export type KeyAlgorithm = z.infer<typeof KeyAlgorithm>;

export const ConsumerKeychainKey = z.strictObject({
  algorithm: KeyAlgorithm,
  createdAt: z.coerce.date(),
  encodedPem: z.string(),
  format: KeyFormat,
  kid: z.string(),
  name: LocalizedName,
  userId: UserId,
});
export type ConsumerKeychainKey = z.infer<typeof ConsumerKeychainKey>;

export const ConsumerKeychain = z.strictObject({
  createdAt: z.coerce.date(),
  description: LocalizedDescription.optional(),
  id: ConsumerKeychainId,
  keys: z.array(ConsumerKeychainKey),
  name: LocalizedName,
  ownerId: OrganizationId,
  purposes: z.array(PurposeId),
  updatedAt: z.coerce.date(),
  users: z.array(UserId),
});

export type ConsumerKeychain = z.infer<typeof ConsumerKeychain>;

export const FlatConsumerKeychain = ConsumerKeychain.omit({
  keys: true,
  purposes: true,
  users: true,
});

export type FlatConsumerKeychain = z.infer<typeof FlatConsumerKeychain>;
