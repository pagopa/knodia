import z from "zod";

export const API_TokenRequest = z
  .strictObject({
    client_id: z.string().optional(),
    grant_type: z.string().optional(),
    scope: z.string().optional(),
  })
  .meta({ id: "TokenRequest" });

export type API_TokenRequest = z.infer<typeof API_TokenRequest>;

export const API_TokenResponse = z
  .strictObject({
    access_token: z.string(),
    expires_in: z.number().int().positive().meta({ format: "int32" }),
    token_type: z.literal("Bearer"),
  })
  .meta({ id: "TokenResponse" });
