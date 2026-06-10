import { SignupDbConfig } from "@knodia/db-signup/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { KafkaConfig, SignupTopicConfig } from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const OneIdentityConfig = z
  .object({
    ONE_IDENTITY_CLIENT_ID: z.string(),
    ONE_IDENTITY_CLIENT_SECRET: z.string(),
    ONE_IDENTITY_DOMAIN: z.string(),
    ONE_IDENTITY_JWKS_URI: z.string(),
    ONE_IDENTITY_REDIRECT_URL: z.string(),

    UI_SIGNUP_SESSION_JWT_AUDIENCE: z.string(),
    UI_SIGNUP_SESSION_JWT_ISSUER: z.string(),
    UI_SIGNUP_SESSION_JWT_KID: z.string(),
    UI_SIGNUP_SESSION_JWT_SECONDS_DURATION: z.coerce
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

    uiSignupSessionJwt: {
      audience: c.UI_SIGNUP_SESSION_JWT_AUDIENCE,
      issuer: c.UI_SIGNUP_SESSION_JWT_ISSUER,
      kid: c.UI_SIGNUP_SESSION_JWT_KID,
      secondsDuration: c.UI_SIGNUP_SESSION_JWT_SECONDS_DURATION,
    },
  }));
export type OneIdentityConfig = z.infer<typeof OneIdentityConfig>;

const SignupManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(OneIdentityConfig)
  .and(SignupDbConfig)
  .and(KafkaConfig)
  .and(SignupTopicConfig);
export type SignupManagerConfig = z.infer<typeof SignupManagerConfig>;

export const config = SignupManagerConfig.parse(process.env);
