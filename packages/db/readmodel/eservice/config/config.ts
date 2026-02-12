import { ReadModelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

export const ReadModelEserviceConfig = ReadModelConfig.and(
  z
    .object({
      READMODEL_DB_ESERVICE_SCHEMA: z.string().default("eservice"),
    })
    .transform((c) => ({
      readmodelDbEserviceSchema: c.READMODEL_DB_ESERVICE_SCHEMA,
    })),
);
export type ReadModelEserviceConfig = z.infer<typeof ReadModelEserviceConfig>;

export const readModelEserviceConfig: ReadModelEserviceConfig =
  ReadModelEserviceConfig.parse(env);
