import z from "zod";

const API_ConsumerKeychainId = z.uuid().meta({
  description: "Unique identifier of the Consumer Keychain",
});

export const API_TokenRequest = z
  .looseObject({
    client_assertion: z.jwt(),
    client_assertion_type: z.string(),
    client_id: API_ConsumerKeychainId,
    grant_type: z.string(),
  })
  .meta({ id: "TokenRequest" });
export type API_TokenRequest = z.infer<typeof API_TokenRequest>;

// TODO remove this mocked response model when the real token flow is implemented.
export const API_TokenResponse = z
  .strictObject({
    mockAccessToken: z.string(),
  })
  .meta({ id: "TokenResponse" });
