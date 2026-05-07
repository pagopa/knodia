import { API_KeyId } from "@knodia/common-models/api";
import z from "zod";

import { API_Attribute } from "../attribute/api.ts";

const API_ConsumerKeychainId = z.uuid().meta({
  description: "Unique identifier of the Consumer Keychain",
});

const API_PurposeId = z.uuid().meta({
  description: "Unique identifier of the Purpose",
});

export const API_ConsumerClientAssertionVerificationRequest = z
  .strictObject({
    keychainId: API_ConsumerKeychainId,
    kid: API_KeyId,
    purposeId: API_PurposeId,
  })
  .meta({ id: "ConsumerClientAssertionVerificationRequest" });
export type API_ConsumerClientAssertionVerificationRequest = z.infer<
  typeof API_ConsumerClientAssertionVerificationRequest
>;

export const API_KnodeApiClientAssertionVerificationRequest = z
  .strictObject({
    keychainId: API_ConsumerKeychainId,
    kid: API_KeyId,
  })
  .meta({ id: "KnodeApiClientAssertionVerificationRequest" });
export type API_KnodeApiClientAssertionVerificationRequest = z.infer<
  typeof API_KnodeApiClientAssertionVerificationRequest
>;

const API_PublicKeyForVerification = z
  .strictObject({
    algorithm: z.string(),
    encodedPem: z.string(),
    format: z.string(),
    kid: API_KeyId,
  })
  .meta({ id: "PublicKeyForVerification" });

export const API_ConsumerClientAssertionVerificationResponse = z
  .strictObject({
    consumerAttributes: z.array(API_Attribute).meta({
      description: "Attributes of the Consumer organization",
    }),
    publicKey: API_PublicKeyForVerification,
  })
  .meta({ id: "ConsumerClientAssertionVerificationResponse" });
export type API_ConsumerClientAssertionVerificationResponse = z.infer<
  typeof API_ConsumerClientAssertionVerificationResponse
>;

export const API_KnodeApiClientAssertionVerificationResponse = z
  .strictObject({
    publicKey: API_PublicKeyForVerification,
  })
  .meta({ id: "KnodeApiClientAssertionVerificationResponse" });
export type API_KnodeApiClientAssertionVerificationResponse = z.infer<
  typeof API_KnodeApiClientAssertionVerificationResponse
>;
