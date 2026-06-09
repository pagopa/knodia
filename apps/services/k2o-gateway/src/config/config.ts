import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { TokenGeneratorConfig } from "@knodia/token-generator/config";
import z from "zod";

const K2OGatewayConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(TokenGeneratorConfig)
  .and(
    z
      .object({
        KEYCHAIN_PROCESS_URL: z.url(),
      })
      .transform((c) => ({
        keychainProcessUrl: c.KEYCHAIN_PROCESS_URL,
      })),
  );
export type K2OGatewayConfig = z.infer<typeof K2OGatewayConfig>;

export const config = K2OGatewayConfig.parse(process.env);
