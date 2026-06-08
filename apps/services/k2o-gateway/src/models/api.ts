import { API_KeyId } from "@knodia/common-models/api";
import z from "zod";

export const API_KeyIdPathParam = z.strictObject({
  keyId: API_KeyId,
});
export type API_KeyIdPathParam = z.infer<typeof API_KeyIdPathParam>;

export const API_PublicKey = z
  .strictObject({
    algorithm: z.string(),
    encodedPem: z.string(),
    format: z.string(),
    kid: API_KeyId,
  })
  .meta({ description: "Public Key details", id: "PublicKey" });
