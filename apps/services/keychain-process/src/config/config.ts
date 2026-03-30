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
        COGNITO_USER_POOL_ID: z.string().min(1),
        MAX_KEYS_PER_KEYCHAIN: z.coerce.number().default(100),
      })
      .transform((c) => ({
        cognitoUserPoolId: c.COGNITO_USER_POOL_ID,
        maxKeysPerKeychain: c.MAX_KEYS_PER_KEYCHAIN,
      })),
  )
  .and(EventStoreKeychainConfig)
  .and(ReadmodelKeychainConfig);
export type KeychainProcessConfig = z.infer<typeof KeychainProcessConfig>;

export const config = KeychainProcessConfig.parse(process.env);
