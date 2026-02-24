import { KeychainId } from "@knodia/common-models/ids";
import { LocalizedText } from "@knodia/common-models/localization";
import z from "zod";

import {
  maxDescriptionLength,
  maxNameLength,
  minDescriptionLength,
  minNameLength,
} from "./keychain.ts";

export const API_KeychainKind = z
  .enum(["Producer", "Consumer", "Api"])
  .meta({ id: "KeychainKind" });
export type API_KeychainKind = z.infer<typeof API_KeychainKind>;

export const API_KeychainIdPathParam = z.strictObject({
  keychainId: KeychainId,
});
export type API_KeychainIdPathParam = z.infer<typeof API_KeychainIdPathParam>;

export const API_LocalizedName = LocalizedText(
  minNameLength,
  maxNameLength,
).meta({ description: "Name of the Keychain", id: "LocalizedName" });
export type API_LocalizedName = z.infer<typeof API_LocalizedName>;

export const API_LocalizedDescription = LocalizedText(
  minDescriptionLength,
  maxDescriptionLength,
).meta({
  description: "Description of the Keychain",
  id: "LocalizedDescription",
});
export type API_LocalizedDescription = z.infer<typeof API_LocalizedDescription>;

export const API_KeyFormat = z.enum(["jwk", "x509"]).meta({ id: "KeyFormat" });
export type API_KeyFormat = z.infer<typeof API_KeyFormat>;

export const API_KeyUse = z.enum(["sig", "enc"]).meta({ id: "KeyUse" });
export type API_KeyUse = z.infer<typeof API_KeyUse>;
