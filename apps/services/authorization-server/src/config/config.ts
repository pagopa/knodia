import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const AuthorizationServerConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      CLIENT_ASSERTION_ACCEPTED_AUDIENCES: z.string(),
      KNODE_URL: z.url(),
    })
    .transform((c) => ({
      clientAssertionAcceptedAudiences:
        c.CLIENT_ASSERTION_ACCEPTED_AUDIENCES.split(",").map((aud) =>
          aud.trim(),
        ),
      knodeUrl: c.KNODE_URL,
    })),
);

export type AuthorizationServerConfig = z.infer<
  typeof AuthorizationServerConfig
>;

export const config = AuthorizationServerConfig.parse(process.env);
