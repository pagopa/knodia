import { API_KeyId } from "@knodia/common-models/api";
import z from "zod";

const API_KeyAlgorithm = z
  .enum(["RS256"])
  .meta({ description: "Algorithm of the Key", id: "KeyAlgorithm" });

export const API_KeyIdPathParam = z.strictObject({
  keyId: API_KeyId,
});
export type API_KeyIdPathParam = z.infer<typeof API_KeyIdPathParam>;

export const API_PublicKey = z
  .strictObject({
    algorithm: API_KeyAlgorithm,
    encodedPem: z.string(),
    kid: API_KeyId,
  })
  .meta({ description: "Public Key details", id: "PublicKey" });
