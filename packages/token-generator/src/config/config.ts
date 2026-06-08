import { z } from "zod";

export const TokenGeneratorConfig = z
  .object({
    INTERNAL_JWT_AUDIENCE: z.string(),
    INTERNAL_JWT_ISSUER: z.string(),
    INTERNAL_JWT_KID: z.string(),
    INTERNAL_JWT_SECONDS_DURATION: z.coerce
      .number()
      .int()
      .positive()
      .default(3600),
    INTERNAL_JWT_SUBJECT: z.string(),
  })
  .transform((c) => ({
    internalJwt: {
      audience: c.INTERNAL_JWT_AUDIENCE,
      issuer: c.INTERNAL_JWT_ISSUER,
      kid: c.INTERNAL_JWT_KID,
      secondsDuration: c.INTERNAL_JWT_SECONDS_DURATION,
      subject: c.INTERNAL_JWT_SUBJECT,
    },
  }));

export type TokenGeneratorConfig = z.infer<typeof TokenGeneratorConfig>;
