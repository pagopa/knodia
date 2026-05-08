import { CognitoIdmClientConfig } from "@knodia/cognito-idm-client";
import { EventStoreKeychainConfig } from "@knodia/db-event-store-keychain/config";
import { ReadmodelKeychainConfig } from "@knodia/db-readmodel-keychain/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const KeychainProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(
    z
      .object({
        MAX_KEYS_PER_KEYCHAIN: z.coerce.number().default(100),
        REMOTE_RESOURCES_MANAGER_URL: z.url(),
      })
      .transform((c) => ({
        maxKeysPerKeychain: c.MAX_KEYS_PER_KEYCHAIN,
        remoteResourcesManagerUrl: c.REMOTE_RESOURCES_MANAGER_URL,
      })),
  )
  .and(EventStoreKeychainConfig)
  .and(ReadmodelKeychainConfig)
  .and(CognitoIdmClientConfig);

export type KeychainProcessConfig = z.infer<typeof KeychainProcessConfig>;

export const config = KeychainProcessConfig.parse(process.env);
