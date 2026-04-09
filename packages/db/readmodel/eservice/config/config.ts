import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

export const ReadmodelEserviceConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_ESERVICE_SCHEMA: z.string(),
    })
    .transform((c) => ({
      readmodelDbEserviceSchema: c.READMODEL_DB_ESERVICE_SCHEMA,
    })),
);
export type ReadmodelEserviceConfig = z.infer<typeof ReadmodelEserviceConfig>;

export const readmodelEserviceConfig: ReadmodelEserviceConfig =
  ReadmodelEserviceConfig.parse(env);
