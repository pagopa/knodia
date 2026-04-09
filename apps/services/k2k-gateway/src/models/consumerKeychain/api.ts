import z from "zod";

import { API_Attribute } from "../attribute/api.ts";

export const API_AccessTokenDataRequest = z
  .strictObject({
    kid: z.string().meta({
      description: "Key ID from client assertion header",
    }),
    purposeId: z.uuid().meta({
      description: "Purpose ID from client assertion claims",
    }),
  })
  .meta({ id: "AccessTokenDataRequest" });
export type API_AccessTokenDataRequest = z.infer<
  typeof API_AccessTokenDataRequest
>;

export const API_ConsumerKeychainIdPathParam = z.strictObject({
  keychainId: z.uuid().meta({
    description: "Consumer Keychain ID",
  }),
});

export const API_PublicKeyForVerification = z
  .strictObject({
    algorithm: z.string(),
    encodedPem: z.string(),
    format: z.string(),
    kid: z.string(),
  })
  .meta({ id: "PublicKeyForVerification" });

export const API_AccessTokenDataResponse = z
  .strictObject({
    consumerAttributes: z.array(API_Attribute).meta({
      description: "Attributes of the Consumer organization",
    }),
    publicKey: API_PublicKeyForVerification,
  })
  .meta({ id: "AccessTokenDataResponse" });
export type API_AccessTokenDataResponse = z.infer<
  typeof API_AccessTokenDataResponse
>;
