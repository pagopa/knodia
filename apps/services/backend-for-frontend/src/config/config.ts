import { KnodeId } from "@knodia/common-models/ids";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { PollingConfig } from "@knodia/polling/config";
import z from "zod";

const BffProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(PollingConfig)
  .and(
    z
      .object({
        AGREEMENT_PROCESS_URL: z.url(),
        COGNITO_ISSUER: z.string(),
        COGNITO_JWKS_URL: z.url(),
        COOKIE_DOMAIN: z.string().optional(),
        COOKIE_SECURE: z.coerce.boolean().default(true),
        DYNAMODB_REFRESH_TOKENS_TABLE: z
          .string()
          .default("knodia-bff-refresh-tokens"),
        ESERVICE_INTERFACES_S3_BUCKET: z.string(),
        ESERVICE_PROCESS_URL: z.url(),
        KEYCHAIN_PROCESS_URL: z.url(),
        KNODE_ID: KnodeId,
        ORGANIZATION_PROCESS_URL: z.url(),
        PURPOSE_PROCESS_URL: z.url(),
        RECENT_ESERVICE_UPDATE_DAYS: z.coerce.number().positive().default(3),
        REFRESH_JWT_SECONDS_DURATION: z.coerce
          .number()
          .int()
          .positive()
          .default(86400),
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
        agreementProcessUrl: c.AGREEMENT_PROCESS_URL,
        cognitoIssuer: c.COGNITO_ISSUER,
        cognitoJwksUrl: c.COGNITO_JWKS_URL,
        cookie: {
          domain: c.COOKIE_DOMAIN,
          secure: c.COOKIE_SECURE,
        },
        dynamoDbRefreshTokensTable: c.DYNAMODB_REFRESH_TOKENS_TABLE,
        eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
        eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
        keychainProcessUrl: c.KEYCHAIN_PROCESS_URL,
        knodeId: c.KNODE_ID,
        organizationProcessUrl: c.ORGANIZATION_PROCESS_URL,
        purposeProcessUrl: c.PURPOSE_PROCESS_URL,
        recentEserviceUpdateDays: c.RECENT_ESERVICE_UPDATE_DAYS,
        refreshJwt: {
          secondsDuration: c.REFRESH_JWT_SECONDS_DURATION,
        },
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
