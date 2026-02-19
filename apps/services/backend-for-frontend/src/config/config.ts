import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const BffProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(
    z
      .object({
        COGNITO_KMS_KEY_ID: z.string(),
        ESERVICE_INTERFACES_S3_BUCKET: z.string(),
        ESERVICE_PROCESS_URL: z.url(),
        KMS_ENDPOINT: z.url(),
        REMOTE_RESOURCES_MANAGER_URL: z.url(),
        TOKEN_AUDIENCE: z.string(),
      })
      .transform((c) => ({
        cognitoKmsKeyId: c.COGNITO_KMS_KEY_ID,
        eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
        eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
        kmsEndpoint: c.KMS_ENDPOINT,
        remoteResourcesManagerUrl: c.REMOTE_RESOURCES_MANAGER_URL,
        tokenAudience: c.TOKEN_AUDIENCE,
      })),
  );
export type BffProcessConfig = z.infer<typeof BffProcessConfig>;

export const config = BffProcessConfig.parse(process.env);
