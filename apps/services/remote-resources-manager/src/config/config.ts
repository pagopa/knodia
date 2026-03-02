import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { env } from "node:process";
import { z } from "zod";

const ResourceManagerDbConfig = z
  .object({
    RESOURCE_MANAGER_DB_AGREEMENT_SCHEMA: z.string().default("agreement"),
    RESOURCE_MANAGER_DB_HOST: z.string().default("localhost"),
    RESOURCE_MANAGER_DB_NAME: z.string().default("root"),
    RESOURCE_MANAGER_DB_PASSWORD: z.string().default("root"),
    RESOURCE_MANAGER_DB_PORT: z.coerce
      .number()
      .int()
      .min(1024)
      .max(65535)
      .default(6003),
    RESOURCE_MANAGER_DB_USE_SSL: z.stringbool().default(false),
    RESOURCE_MANAGER_DB_USER: z.string().default("root"),
  })
  .transform((c) => ({
    resourceManagerDbAgreementSchema: c.RESOURCE_MANAGER_DB_AGREEMENT_SCHEMA,
    resourceManagerDbHost: c.RESOURCE_MANAGER_DB_HOST,
    resourceManagerDbName: c.RESOURCE_MANAGER_DB_NAME,
    resourceManagerDbPassword: c.RESOURCE_MANAGER_DB_PASSWORD,
    resourceManagerDbPort: c.RESOURCE_MANAGER_DB_PORT,
    resourceManagerDbUser: c.RESOURCE_MANAGER_DB_USER,
    resourceManagerDbUseSsl: c.RESOURCE_MANAGER_DB_USE_SSL,
  }));
type ResourceManagerDbConfig = z.infer<typeof ResourceManagerDbConfig>;

export const resourceManagerDbConfig: ResourceManagerDbConfig =
  ResourceManagerDbConfig.parse(env);

const RemoteResourcesManagerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(ResourceManagerDbConfig)
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
