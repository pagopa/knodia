import { TargetKnodeUrls } from "@knodia/common-models/targetKnodeUrls";
import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import { RemoteResourceDbConfig } from "@knodia/db-remote-resource/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { env } from "node:process";
import { z } from "zod";

const RemoteResourcesManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(RemoteResourceDbConfig)
  .and(ReadmodelOrganizationConfig)
  .and(
    z
      .object({
        TARGET_KNODE_URLS: TargetKnodeUrls,
      })
      .transform((c) => ({
        targetKnodeUrls: c.TARGET_KNODE_URLS,
      })),
  );
export type RemoteResourcesManagerConfig = z.infer<
  typeof RemoteResourcesManagerConfig
>;

export const config: RemoteResourcesManagerConfig =
  RemoteResourcesManagerConfig.parse(env);
