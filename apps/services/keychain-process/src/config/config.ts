import { EventStoreKeychainConfig } from "@knodia/db-event-store-keychain/config";
import { ReadmodelKeychainConfig } from "@knodia/db-readmodel-keychain/config";
import { ReadmodelPurposeConfig } from "@knodia/db-readmodel-purpose/config";
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
        REMOTE_RESOURCES_MANAGER_URL: z.url(),
      })
      .transform((c) => ({
        cognitoUserPoolId: c.COGNITO_USER_POOL_ID,
        remoteResourcesManagerUrl: c.REMOTE_RESOURCES_MANAGER_URL,
      })),
  )
  .and(EventStoreKeychainConfig)
  .and(ReadmodelKeychainConfig)
  .and(ReadmodelPurposeConfig);
export type KeychainProcessConfig = z.infer<typeof KeychainProcessConfig>;

export const config = KeychainProcessConfig.parse(process.env);
