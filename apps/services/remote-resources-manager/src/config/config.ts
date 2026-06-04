import { TargetKnodeUrlsConfig } from "@knodia/common-models/targetKnodeUrls";
import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import { RemoteResourceDbConfig } from "@knodia/db-remote-resource/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { env } from "node:process";
import { type z } from "zod";

const RemoteResourcesManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(RemoteResourceDbConfig)
  .and(ReadmodelOrganizationConfig)
  .and(TargetKnodeUrlsConfig);
export type RemoteResourcesManagerConfig = z.infer<
  typeof RemoteResourcesManagerConfig
>;

export const config: RemoteResourcesManagerConfig =
  RemoteResourcesManagerConfig.parse(env);
