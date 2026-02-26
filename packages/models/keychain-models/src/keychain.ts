import {
  KeychainId,
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

export const KeychainKind = z.enum(["Producer", "Consumer", "Api"]);
export type KeychainKind = z.infer<typeof KeychainKind>;

export const KeyFormat = z.enum(["jwk", "x509"]);
export type KeyFormat = z.infer<typeof KeyFormat>;

export const KeyUse = z.enum(["sig", "enc"]);
export type KeyUse = z.infer<typeof KeyUse>;

export const KeychainKey = z.object({
  algorithm: z.string(),
  createdAt: z.coerce.date(),
  encodedPem: z.string(),
  format: KeyFormat,
  kid: z.string(),
  name: LocalizedName,
  use: KeyUse,
  userId: UserId,
});
export type KeychainKey = z.infer<typeof KeychainKey>;

export const Keychain = z.object({
  createdAt: z.coerce.date(),
  description: LocalizedDescription.optional(),
  id: KeychainId,
  keys: z.array(KeychainKey),
  kind: KeychainKind,
  name: LocalizedName,
  ownerId: OrganizationId,
  purposes: z.array(PurposeId),
  updatedAt: z.coerce.date(),
  users: z.array(UserId),
});

export type Keychain = z.infer<typeof Keychain>;
