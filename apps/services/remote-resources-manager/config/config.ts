import { env } from "node:process";
import { z } from "zod";

export const RemoteResourceDbConfig = z
  .object({
    REMOTE_RESOURCE_DB_AGREEMENT_SCHEMA: z.string().default("agreement"),
    REMOTE_RESOURCE_DB_HOST: z.string().default("localhost"),
    REMOTE_RESOURCE_DB_NAME: z.string().default("remote_resource"),
    REMOTE_RESOURCE_DB_PASSWORD: z.string().default("root"),
    REMOTE_RESOURCE_DB_PORT: z.coerce
      .number()
      .int()
      .min(1024)
      .max(65535)
      .default(5432),
    REMOTE_RESOURCE_DB_USE_SSL: z.stringbool().default(false),
    REMOTE_RESOURCE_DB_USER: z.string().default("root"),
  })
  .transform((c) => ({
    remoteResourceDbAgreementSchema: c.REMOTE_RESOURCE_DB_AGREEMENT_SCHEMA,
    remoteResourceDbHost: c.REMOTE_RESOURCE_DB_HOST,
    remoteResourceDbName: c.REMOTE_RESOURCE_DB_NAME,
    remoteResourceDbPassword: c.REMOTE_RESOURCE_DB_PASSWORD,
    remoteResourceDbPort: c.REMOTE_RESOURCE_DB_PORT,
    remoteResourceDbUser: c.REMOTE_RESOURCE_DB_USER,
    remoteResourceDbUseSsl: c.REMOTE_RESOURCE_DB_USE_SSL,
  }));
export type RemoteResourceDbConfig = z.infer<typeof RemoteResourceDbConfig>;

export const remoteResourceDbConfig: RemoteResourceDbConfig =
  RemoteResourceDbConfig.parse(env);
