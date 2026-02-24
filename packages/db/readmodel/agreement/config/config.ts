import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

const ReadmodelAgreementConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_AGREEMENT_SCHEMA: z.string().default("agreement"),
    })
    .transform((c) => ({
      readmodelDbAgreementSchema: c.READMODEL_DB_AGREEMENT_SCHEMA,
    })),
);
type ReadmodelAgreementConfig = z.infer<typeof ReadmodelAgreementConfig>;

export const readmodelAgreementConfig: ReadmodelAgreementConfig =
  ReadmodelAgreementConfig.parse(env);
