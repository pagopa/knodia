import { ReadmodelConfig } from "@knodia/db-readmodel-config/config";
import { env } from "node:process";
import { z } from "zod";

export const ReadmodelConsumerKeychainConfig = ReadmodelConfig.and(
  z
    .object({
      READMODEL_DB_CONSUMER_KEYCHAIN_SCHEMA: z
        .string()
        .default("consumer_keychain"),
    })
    .transform((c) => ({
      readmodelDbConsumerKeychainSchema:
        c.READMODEL_DB_CONSUMER_KEYCHAIN_SCHEMA,
    })),
);
type ReadmodelConsumerKeychainConfig = z.infer<
  typeof ReadmodelConsumerKeychainConfig
>;

export const readmodelConsumerKeychainConfig: ReadmodelConsumerKeychainConfig =
  ReadmodelConsumerKeychainConfig.parse(env);
