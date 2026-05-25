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

    SIGNUP_SESSION_JWT_AUDIENCE: z.string(),
    SIGNUP_SESSION_JWT_ISSUER: z.string(),
    SIGNUP_SESSION_JWT_KID: z.string(),
    SIGNUP_SESSION_JWT_SECONDS_DURATION: z.coerce
      .number()
      .int()
      .positive()
      .default(3600),
  })
  .transform((c) => ({
    oneIdentityClientId: c.ONE_IDENTITY_CLIENT_ID,
    oneIdentityClientSecret: c.ONE_IDENTITY_CLIENT_SECRET,
    oneIdentityDomain: c.ONE_IDENTITY_DOMAIN,
    oneIdentityJWKSUri: c.ONE_IDENTITY_JWKS_URI,
    oneIdentityRedirectUrl: c.ONE_IDENTITY_REDIRECT_URL,

    signupSessionJwt: {
      audience: c.SIGNUP_SESSION_JWT_AUDIENCE,
      issuer: c.SIGNUP_SESSION_JWT_ISSUER,
      kid: c.SIGNUP_SESSION_JWT_KID,
      secondsDuration: c.SIGNUP_SESSION_JWT_SECONDS_DURATION,
    },
  }));
export type OneIdentityConfig = z.infer<typeof OneIdentityConfig>;

const SignupManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(OneIdentityConfig);
export type SignupManagerConfig = z.infer<typeof SignupManagerConfig>;

export const config = SignupManagerConfig.parse(process.env);
