import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const RemoteResourcesManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
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

export const config = RemoteResourcesManagerConfig.parse(process.env);
