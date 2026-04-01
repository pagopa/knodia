import z from "zod";

export const TokenRequest = z
  .strictObject({
    client_id: z.string().optional(),
    grant_type: z.string().optional(),
    scope: z.string().optional(),
  })
  .meta({ id: "TokenRequest" });

export type TokenRequest = z.infer<typeof TokenRequest>;

export const TokenResponse = z
  .strictObject({
    access_token: z.string(),
    expires_in: z.number().int().positive().meta({ format: "int32" }),
    token_type: z.literal("Bearer"),
  })
  .meta({ id: "TokenResponse" });

export function tokenServiceBuilder() {
  return {
    issueToken: async (_request: TokenRequest) =>
      TokenResponse.parse({
        access_token: "mock-access-token",
        expires_in: 300,
        token_type: "Bearer",
      }),
  };
}
