import { KnodeId } from "@knodia/common-models/ids";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { RateLimiterConfig } from "@knodia/fastify-zod-api-commons/rate-limit";
import { LoggerConfig } from "@knodia/logger/config";
import { PollingConfig } from "@knodia/polling/config";
import z from "zod";

const BffProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(PollingConfig)
  .and(RateLimiterConfig)
  .and(
    z
      .object({
        AGREEMENT_PROCESS_URL: z.url(),
        AUTH_COOKIE_ALLOWED_ORIGINS: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((u) => u.trim()))
          .pipe(z.url().array().min(1)),
        COGNITO_ISSUER: z.string(),
        COGNITO_JWKS_URL: z.url(),
        COOKIE_PATH_PREFIX: z.string(),
        COOKIE_SECURE: z.coerce.boolean().default(true),
        DYNAMODB_MAGIC_LINK_TOKENS_TABLE: z
          .string()
          .default("knodia-bff-magic-link-tokens"),
        DYNAMODB_REFRESH_TOKENS_TABLE: z
          .string()
          .default("knodia-bff-refresh-tokens"),
        ESERVICE_INTERFACES_S3_BUCKET: z.string(),
        ESERVICE_PROCESS_URL: z.url(),
        EXTERNAL_UI_SESSION_JWT_AUDIENCE: z.string(),
        EXTERNAL_UI_SESSION_JWT_ISSUER: z.string(),
        EXTERNAL_UI_SESSION_JWT_KID: z.string(),
        EXTERNAL_UI_SESSION_JWT_SECONDS_DURATION: z.coerce
          .number()
          .int()
          .positive()
          .default(300),
        EXTERNAL_UI_SESSION_MAGIC_LINK_ACCEPTED_AUDIENCE: z.string(),
        EXTERNAL_UI_SESSION_MAGIC_LINK_ACCEPTED_ISSUER: z.string(),
        EXTERNAL_UI_SESSION_MAGIC_LINK_WELL_KNOWN_URLS: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((u) => u.trim()))
          .pipe(z.string().array()),
        KEYCHAIN_PROCESS_URL: z.url(),
        KNODE_ID: KnodeId,
        ORGANIZATION_PROCESS_URL: z.url(),
        PURPOSE_PROCESS_URL: z.url(),
        RECENT_UPDATE_DAYS: z.coerce.number().positive().default(3),
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
        authCookieAllowedOrigins: c.AUTH_COOKIE_ALLOWED_ORIGINS,
        cognitoIssuer: c.COGNITO_ISSUER,
        cognitoJwksUrl: c.COGNITO_JWKS_URL,
        cookie: {
          pathPrefix: c.COOKIE_PATH_PREFIX,
          secure: c.COOKIE_SECURE,
        },
        dynamoDbMagicLinkTokensTable: c.DYNAMODB_MAGIC_LINK_TOKENS_TABLE,
        dynamoDbRefreshTokensTable: c.DYNAMODB_REFRESH_TOKENS_TABLE,
        eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
        eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
        externalUiSessionJwt: {
          audience: c.EXTERNAL_UI_SESSION_JWT_AUDIENCE,
          issuer: c.EXTERNAL_UI_SESSION_JWT_ISSUER,
          kid: c.EXTERNAL_UI_SESSION_JWT_KID,
          secondsDuration: c.EXTERNAL_UI_SESSION_JWT_SECONDS_DURATION,
        },
        externalUiSessionMagicLinkAccepted: {
          audience: c.EXTERNAL_UI_SESSION_MAGIC_LINK_ACCEPTED_AUDIENCE,
          issuer: c.EXTERNAL_UI_SESSION_MAGIC_LINK_ACCEPTED_ISSUER,
          wellKnownUrls: c.EXTERNAL_UI_SESSION_MAGIC_LINK_WELL_KNOWN_URLS,
        },
        keychainProcessUrl: c.KEYCHAIN_PROCESS_URL,
        knodeId: c.KNODE_ID,
        organizationProcessUrl: c.ORGANIZATION_PROCESS_URL,
        purposeProcessUrl: c.PURPOSE_PROCESS_URL,
        recentUpdateDays: c.RECENT_UPDATE_DAYS,
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
