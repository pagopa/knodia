import z from "zod";

import {
  EXPECTED_CLIENT_ASSERTION_TYPE,
  EXPECTED_GRANT_TYPE,
} from "./constants.ts";

const API_ConsumerKeychainId = z.uuid().meta({
  description: "Unique identifier of the Consumer Keychain",
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
    token_type: z.enum(["Bearer"]),
  })
  .meta({ id: "TokenResponse" });
export type API_TokenResponse = z.infer<typeof API_TokenResponse>;
