import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

export const ReadmodelOrganizationConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_ORGANIZATION_SCHEMA: z.string().default("organization"),
    })
    .transform((c) => ({
      readmodelDbOrganizationSchema: c.READMODEL_DB_ORGANIZATION_SCHEMA,
    })),
);
export type ReadmodelOrganizationConfig = z.infer<
  typeof ReadmodelOrganizationConfig
>;

export const readmodelOrganizationConfig: ReadmodelOrganizationConfig =
  ReadmodelOrganizationConfig.parse(env);
