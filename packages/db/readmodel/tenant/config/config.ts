import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

export const ReadmodelTenantConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_TENANT_SCHEMA: z.string().default("tenant"),
    })
    .transform((c) => ({
      readmodelDbTenantSchema: c.READMODEL_DB_TENANT_SCHEMA,
    })),
);
export type ReadmodelTenantConfig = z.infer<typeof ReadmodelTenantConfig>;

export const readmodelTenantConfig: ReadmodelTenantConfig =
  ReadmodelTenantConfig.parse(env);
