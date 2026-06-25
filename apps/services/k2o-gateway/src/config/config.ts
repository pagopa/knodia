import { KnodeId } from "@knodia/common-models/ids";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { RateLimiterConfig } from "@knodia/fastify-zod-api-commons/rate-limit";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const K2OGatewayConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(RateLimiterConfig)
  .and(
    z
      .object({
        KEYCHAIN_PROCESS_URL: z.url(),
        KNODE_ID: KnodeId,
      })
      .transform((c) => ({
        keychainProcessUrl: c.KEYCHAIN_PROCESS_URL,
        knodeId: c.KNODE_ID,
      })),
  );
export type K2OGatewayConfig = z.infer<typeof K2OGatewayConfig>;

export const config = K2OGatewayConfig.parse(process.env);
