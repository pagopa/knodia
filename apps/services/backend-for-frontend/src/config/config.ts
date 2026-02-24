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
        COGNITO_ISSUER: z.string(),
        COGNITO_JWKS_URL: z.url(),
        ESERVICE_INTERFACES_S3_BUCKET: z.string(),
        ESERVICE_PROCESS_URL: z.url(),
        KMS_ENDPOINT: z.url(),
        REMOTE_RESOURCES_MANAGER_URL: z.url(),
        UI_SESSION_JWT_AUDIENCE: z.string(),
        UI_SESSION_JWT_ISSUER: z.string(),
        UI_SESSION_JWT_KID: z.string(),
        UI_SESSION_JWT_SECONDS_DURATION: z.coerce
          .number()
          .int()
          .positive()
          .default(3600),
      })
      .transform((c) => ({
        cognitoIssuer: c.COGNITO_ISSUER,
        cognitoJwksUrl: c.COGNITO_JWKS_URL,
        eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
        eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
        kmsEndpoint: c.KMS_ENDPOINT,
        remoteResourcesManagerUrl: c.REMOTE_RESOURCES_MANAGER_URL,
        uiSessionJwt: {
          audience: c.UI_SESSION_JWT_AUDIENCE,
          issuer: c.UI_SESSION_JWT_ISSUER,
          kid: c.UI_SESSION_JWT_KID,
          secondsDuration: c.UI_SESSION_JWT_SECONDS_DURATION,
        },
      })),
  );

export type BffProcessConfig = z.infer<typeof BffProcessConfig>;

export const config = BffProcessConfig.parse(process.env);
