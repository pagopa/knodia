import { z } from "zod";

export const ReadmodelConfig = z
  .object({
    READMODEL_DB_HOST: z.string(),
    READMODEL_DB_NAME: z.string(),
    READMODEL_DB_PASSWORD: z.string(),
    READMODEL_DB_PORT: z.coerce.number().int().min(1024).max(65535),
    READMODEL_DB_USE_SSL: z.stringbool(),
    READMODEL_DB_USER: z.string(),
  })
  .transform((c) => ({
    readmodelDbHost: c.READMODEL_DB_HOST,
    readmodelDbName: c.READMODEL_DB_NAME,
    readmodelDbPassword: c.READMODEL_DB_PASSWORD,
    readmodelDbPort: c.READMODEL_DB_PORT,
    readmodelDbUser: c.READMODEL_DB_USER,
    readmodelDbUseSsl: c.READMODEL_DB_USE_SSL,
  }));
export type ReadmodelConfig = z.infer<typeof ReadmodelConfig>;
