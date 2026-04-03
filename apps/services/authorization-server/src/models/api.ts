import z from "zod";

// TODO remove this mocked response model when the real token flow is implemented.
export const API_TokenRequest = z
  .strictObject({
    mockClientAssertion: z.string(),
  })
  .meta({ id: "TokenRequest" });

export type API_TokenRequest = z.infer<typeof API_TokenRequest>;

// TODO remove this mocked response model when the real token flow is implemented.
export const API_TokenResponse = z
  .strictObject({
    mockAccessToken: z.string(),
  })
  .meta({ id: "TokenResponse" });
