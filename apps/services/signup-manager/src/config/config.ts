import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const OneIdentityConfig = z
  .object({
    ONE_IDENTITY_CLIENT_ID: z.string(),
    ONE_IDENTITY_CLIENT_SECRET: z.string(),
    ONE_IDENTITY_DOMAIN: z.string(),
    ONE_IDENTITY_JWKS_URI: z.string(),
    ONE_IDENTITY_REDIRECT_URL: z.string(),
  })
  .transform((c) => ({
    oneIdentityClientId: c.ONE_IDENTITY_CLIENT_ID,
    oneIdentityClientSecret: c.ONE_IDENTITY_CLIENT_SECRET,
    oneIdentityDomain: c.ONE_IDENTITY_DOMAIN,
    oneIdentityJWKSUri: c.ONE_IDENTITY_JWKS_URI,
    oneIdentityRedirectUrl: c.ONE_IDENTITY_REDIRECT_URL,
  }));
export type OneIdentityConfig = z.infer<typeof OneIdentityConfig>;

const SignupManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(OneIdentityConfig);
export type SignupManagerConfig = z.infer<typeof SignupManagerConfig>;

export const config = SignupManagerConfig.parse(process.env);
