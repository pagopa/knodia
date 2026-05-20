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
    OI_DOMAIN: z.string(),
    OI_REDIRECT_URI: z.string(),
  })
  .transform((c) => ({
    oneIdentityClientId: c.OI_CLIENT_ID,
    oneIdentityClientSecret: c.OI_CLIENT_SECRET,
    oneIdentityDomain: c.OI_DOMAIN,
    oneIdentityRedirectUri: c.OI_REDIRECT_URI,
  }));
export type OneIdentityConfig = z.infer<typeof OneIdentityConfig>;

const SignupManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(OneIdentityConfig);
export type SignupManagerConfig = z.infer<typeof SignupManagerConfig>;

export const config = SignupManagerConfig.parse(process.env);
