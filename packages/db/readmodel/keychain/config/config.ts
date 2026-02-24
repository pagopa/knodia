import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

const ReadmodelKeychainConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_KEYCHAIN_SCHEMA: z.string().default("keychain"),
    })
    .transform((c) => ({
      readmodelDbKeychainSchema: c.READMODEL_DB_KEYCHAIN_SCHEMA,
    })),
);
type ReadmodelKeychainConfig = z.infer<typeof ReadmodelKeychainConfig>;

export const readmodelKeychainConfig: ReadmodelKeychainConfig =
  ReadmodelKeychainConfig.parse(env);
