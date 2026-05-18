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

const API_TokenRequestBase = z.strictObject({
  client_assertion: z.jwt(),
  client_assertion_type: z.literal(EXPECTED_CLIENT_ASSERTION_TYPE),
  grant_type: z.literal(EXPECTED_GRANT_TYPE),
});

const API_TokenResponseBase = z.strictObject({
  access_token: z.string(),
  expires_in: z.number().meta({ format: "int32" }),
});

export const API_EserviceAccessTokenRequest = API_TokenRequestBase.extend({
  client_id: API_ConsumerKeychainId,
}).meta({ id: "EserviceAccessTokenRequest" });
export type API_EserviceAccessTokenRequest = z.infer<
  typeof API_EserviceAccessTokenRequest
>;

export const API_EserviceAccessTokenResponse = API_TokenResponseBase.extend({
  token_type: z.enum(["Bearer", "DPoP"]),
}).meta({ id: "EserviceAccessTokenResponse" });
export type API_EserviceAccessTokenResponse = z.infer<
  typeof API_EserviceAccessTokenResponse
>;

export const API_KnodeApiTokenRequest = API_TokenRequestBase.extend({
  client_id: API_KnodeApiKeychainId,
}).meta({ id: "KnodeApiTokenRequest" });
export type API_KnodeApiTokenRequest = z.infer<typeof API_KnodeApiTokenRequest>;

export const API_KnodeApiTokenResponse = API_TokenResponseBase.extend({
  token_type: z.literal("Bearer"),
}).meta({ id: "KnodeApiTokenResponse" });
export type API_KnodeApiTokenResponse = z.infer<
  typeof API_KnodeApiTokenResponse
>;
