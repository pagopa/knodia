import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const AuthorizationServerConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      CLIENT_ASSERTION_ACCEPTED_AUDIENCES: z.string(),
      CLIENT_ASSERTION_CLOCK_TOLERANCE_SECONDS: z.coerce
        .number()
        .int()
        .positive(),
      CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS: z.coerce
        .number()
        .int()
        .positive(),
      KNODE_URL: z.url(),
    })
    .transform((c) => ({
      clientAssertionAcceptedAudiences:
        c.CLIENT_ASSERTION_ACCEPTED_AUDIENCES.split(",").map((aud) =>
          aud.trim(),
        ),
      clientAssertionClockToleranceSeconds:
        c.CLIENT_ASSERTION_CLOCK_TOLERANCE_SECONDS,
      clientAssertionMaxTokenAgeSeconds:
        c.CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS,
      knodeUrl: c.KNODE_URL,
    })),
);

export type AuthorizationServerConfig = z.infer<
  typeof AuthorizationServerConfig
>;

export const config = AuthorizationServerConfig.parse(process.env);
