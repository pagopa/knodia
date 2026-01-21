import { z } from "zod";

export const ReadModelConfig = z
  .object({
    READMODEL_DB_HOST: z.string().default("localhost"),
    READMODEL_DB_NAME: z.string().default("root"),
    READMODEL_DB_PASSWORD: z.string().default("root"),
    READMODEL_DB_PORT: z.coerce
      .number()
      .int()
      .min(1024)
      .max(65535)
      .default(6002),
    READMODEL_DB_USE_SSL: z.stringbool().default(false),
    READMODEL_DB_USER: z.string().default("root"),
  })
  .transform((c) => ({
    readModelDbHost: c.READMODEL_DB_HOST,
    readModelDbName: c.READMODEL_DB_NAME,
    readModelDbPassword: c.READMODEL_DB_PASSWORD,
    readModelDbPort: c.READMODEL_DB_PORT,
    readModelDbUser: c.READMODEL_DB_USER,
    readModelDbUseSsl: c.READMODEL_DB_USE_SSL,
  }));
export type ReadModelConfig = z.infer<typeof ReadModelConfig>;
