import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const RemoteResourcesManagerConfig = LoggerConfig.and(HTTPServerConfig);
export type RemoteResourcesManagerConfig = z.infer<
  typeof RemoteResourcesManagerConfig
>;

export const config = RemoteResourcesManagerConfig.parse(process.env);
