import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { env } from "node:process";
import { z } from "zod";

import { RemoteResourceDbConfig } from "../../config/config.ts";

const RemoteResourcesManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(RemoteResourceDbConfig)
  .and(
    z
      .object({
        KNODE_URL: z.url(),
      })
      .transform((c) => ({
        knodeUrl: c.KNODE_URL,
      })),
  );
export type RemoteResourcesManagerConfig = z.infer<
  typeof RemoteResourcesManagerConfig
>;

export const config: RemoteResourcesManagerConfig =
  RemoteResourcesManagerConfig.parse(env);
