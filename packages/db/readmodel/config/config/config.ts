import { z } from "zod";

export const ReadmodelConfig = z
  .object({
    READMODEL_DB_HOST: z.string().default("localhost"),
    READMODEL_DB_NAME: z.string().default("readmodel"),
    READMODEL_DB_PASSWORD: z.string().default("root"),
    READMODEL_DB_PORT: z.coerce
      .number()
      .int()
      .min(1024)
      .max(65535)
      .default(5432),
    READMODEL_DB_USE_SSL: z.stringbool().default(false),
    READMODEL_DB_USER: z.string().default("root"),
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
