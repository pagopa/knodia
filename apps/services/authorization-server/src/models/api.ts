import z from "zod";

import {
  EXPECTED_CLIENT_ASSERTION_TYPE,
  EXPECTED_GRANT_TYPE,
} from "./constants.ts";

const API_ConsumerKeychainId = z.uuid().meta({
  description: "Unique identifier of the Consumer Keychain",
});

const API_KnodeApiKeychainId = z.uuid().meta({
  description: "Unique identifier of the Knode API Keychain",
});

export const API_TokenRequest = z
  .strictObject({
    client_assertion: z.jwt(),
    client_assertion_type: z.literal(EXPECTED_CLIENT_ASSERTION_TYPE),
    client_id: API_ConsumerKeychainId,
    grant_type: z.literal(EXPECTED_GRANT_TYPE),
  })
  .meta({ id: "TokenRequest" });
export type API_TokenRequest = z.infer<typeof API_TokenRequest>;

export const API_TokenResponse = z
  .strictObject({
    access_token: z.string(),
    expires_in: z.number().meta({ format: "int32" }),
    token_type: z.enum(["Bearer", "DPoP"]),
  })
  .meta({ id: "TokenResponse" });
export type API_TokenResponse = z.infer<typeof API_TokenResponse>;

export const API_KnodeApiTokenRequest = z
  .strictObject({
    client_assertion: z.jwt(),
    client_assertion_type: z.literal(EXPECTED_CLIENT_ASSERTION_TYPE),
    client_id: API_KnodeApiKeychainId,
    grant_type: z.literal(EXPECTED_GRANT_TYPE),
  })
  .meta({ id: "KnodeApiTokenRequest" });
export type API_KnodeApiTokenRequest = z.infer<typeof API_KnodeApiTokenRequest>;

export const API_KnodeApiTokenResponse = z
  .strictObject({
    access_token: z.string(),
    expires_in: z.number().meta({ format: "int32" }),
    token_type: z.literal("Bearer"),
  })
  .meta({ id: "KnodeApiTokenResponse" });
export type API_KnodeApiTokenResponse = z.infer<
  typeof API_KnodeApiTokenResponse
>;
