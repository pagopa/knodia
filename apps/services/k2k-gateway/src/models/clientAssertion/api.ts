import { API_KeyId } from "@knodia/common-models/api";
import z from "zod";

import { API_Attribute } from "../attribute/api.ts";

const API_ConsumerKeychainId = z.uuid().meta({
  description: "Unique identifier of the Consumer Keychain",
});

const API_PurposeId = z.uuid().meta({
  description: "Unique identifier of the Purpose",
});

export const API_ClientAssertionVerificationRequest = z
  .strictObject({
    keychainId: API_ConsumerKeychainId,
    kid: API_KeyId,
    purposeId: API_PurposeId,
  })
  .meta({ id: "ClientAssertionVerificationRequest" });
export type API_ClientAssertionVerificationRequest = z.infer<
  typeof API_ClientAssertionVerificationRequest
>;

const API_PublicKeyForVerification = z
  .strictObject({
    algorithm: z.string(),
    encodedPem: z.string(),
    format: z.string(),
    kid: API_KeyId,
  })
  .meta({ id: "PublicKeyForVerification" });

export const API_ClientAssertionVerificationResponse = z
  .strictObject({
    consumerAttributes: z.array(API_Attribute).meta({
      description: "Attributes of the Consumer organization",
    }),
    publicKey: API_PublicKeyForVerification,
  })
  .meta({ id: "ClientAssertionVerificationResponse" });
export type API_ClientAssertionVerificationResponse = z.infer<
  typeof API_ClientAssertionVerificationResponse
>;
