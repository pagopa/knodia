import { env } from "node:process";
import { z } from "zod";

export const ResourceManagerDbConfig = z
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
export type ResourceManagerDbConfig = z.infer<typeof ResourceManagerDbConfig>;

export const resourceManagerDbConfig: ResourceManagerDbConfig =
  ResourceManagerDbConfig.parse(env);
