import { EventStoreKeychainConfig } from "@knodia/db-event-store-keychain/config";
import { ReadmodelKeychainConfig } from "@knodia/db-readmodel-keychain/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const KeychainProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(
    z
      .object({
        COGNITO_USER_POOL_ID: z.string().min(1),
      })
      .transform((c) => ({
        cognitoUserPoolId: c.COGNITO_USER_POOL_ID,
      })),
  )
  .and(EventStoreKeychainConfig)
  .and(ReadmodelKeychainConfig);
export type KeychainProcessConfig = z.infer<typeof KeychainProcessConfig>;

export const config = KeychainProcessConfig.parse(process.env);
