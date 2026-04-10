import z from "zod";

import {
  EXPECTED_CLIENT_ASSERTION_TYPE,
  EXPECTED_GRANT_TYPE,
} from "./constants.ts";

export const API_TokenRequest = z
  .strictObject({
    client_assertion: z.jwt(),
    client_assertion_type: z
      .literal(EXPECTED_CLIENT_ASSERTION_TYPE)
      .meta({ description: `Must be '${EXPECTED_CLIENT_ASSERTION_TYPE}'` }),
    consumer_keychain_id: z.uuid(),
    grant_type: z
      .literal(EXPECTED_GRANT_TYPE)
      .meta({ description: `Must be '${EXPECTED_GRANT_TYPE}'` }),
  })
  .meta({ id: "TokenRequest" });
export type API_TokenRequest = z.infer<typeof API_TokenRequest>;

// TODO remove this mocked response model when the real token flow is implemented.
export const API_TokenResponse = z
  .strictObject({
    mockAccessToken: z.string(),
  })
  .meta({ id: "TokenResponse" });
