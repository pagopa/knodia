import { EventStoreKeychainConfig } from "@knodia/db-event-store-keychain/config";
import { ReadmodelConsumerKeychainConfig } from "@knodia/db-readmodel-consumer-keychain/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const KeychainProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreKeychainConfig)
  .and(ReadmodelConsumerKeychainConfig);
export type KeychainProcessConfig = z.infer<typeof KeychainProcessConfig>;

export const config = KeychainProcessConfig.parse(process.env);
