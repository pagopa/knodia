import { ConsumerKeychainId } from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import {
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
} from "./keychain.ts";

export const API_ConsumerKeychainIdPathParam = z.strictObject({
  consumerKeychainId: ConsumerKeychainId,
});
export type API_ConsumerKeychainIdPathParam = z.infer<
  typeof API_ConsumerKeychainIdPathParam
>;

export const API_LocalizedName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({ description: "Name of the Consumer Keychain", id: "LocalizedName" });
export type API_LocalizedName = z.infer<typeof API_LocalizedName>;

export const API_LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
).meta({
  description: "Description of the Consumer Keychain",
  id: "LocalizedDescription",
});
export type API_LocalizedDescription = z.infer<typeof API_LocalizedDescription>;

export const API_KeyFormat = z.enum(["jwk", "x509"]).meta({ id: "KeyFormat" });
export type API_KeyFormat = z.infer<typeof API_KeyFormat>;

export const API_KeyUse = z.enum(["sig", "enc"]).meta({ id: "KeyUse" });
export type API_KeyUse = z.infer<typeof API_KeyUse>;
