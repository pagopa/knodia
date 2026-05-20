import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const OneIdentityConfig = z
  .object({
    OI_CLIENT_ID: z.string(),
    OI_CLIENT_SECRET: z.string(),
    OI_COOKIE_SECRET: z.string(),
    OI_DOMAIN: z.string(),
    OI_REDIRECT_URL: z.string(),
  })
  .transform((c) => ({
    oneIdentityClientId: c.OI_CLIENT_ID,
    oneIdentityClientSecret: c.OI_CLIENT_SECRET,
    oneIdentityCookieSecret: c.OI_COOKIE_SECRET,
    oneIdentityDomain: c.OI_DOMAIN,
    oneIdentityRedirectUrl: c.OI_REDIRECT_URL,
  }));
export type OneIdentityConfig = z.infer<typeof OneIdentityConfig>;

const SignupManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(OneIdentityConfig);
export type SignupManagerConfig = z.infer<typeof SignupManagerConfig>;

export const config = SignupManagerConfig.parse(process.env);
