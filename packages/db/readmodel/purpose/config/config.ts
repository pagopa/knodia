import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

export const ReadmodelPurposeConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_PURPOSE_SCHEMA: z.string(),
    })
    .transform((c) => ({
      readmodelDbPurposeSchema: c.READMODEL_DB_PURPOSE_SCHEMA,
    })),
);
type ReadmodelPurposeConfig = z.infer<typeof ReadmodelPurposeConfig>;

export const readmodelPurposeConfig: ReadmodelPurposeConfig =
  ReadmodelPurposeConfig.parse(env);
