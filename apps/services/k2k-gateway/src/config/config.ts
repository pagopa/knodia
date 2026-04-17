import { KnodeId } from "@knodia/common-models/ids";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { PollingConfig } from "@knodia/polling/config";
import { z } from "zod";

const K2KGatewayConfig = LoggerConfig.and(HTTPServerConfig)
  .and(PollingConfig)
  .and(
    z
      .object({
        AGREEMENT_PROCESS_URL: z.url(),
        CALLER_KNODE_ID: KnodeId,
        ESERVICE_INTERFACES_S3_BUCKET: z.string(),
        ESERVICE_PROCESS_URL: z.url(),
        EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_AUDIENCE: z.string(),
        EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_ISSUER: z.string(),
        EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_KID: z.string(),
        EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_SECONDS_DURATION: z.coerce
          .number()
          .int()
          .positive()
          .default(120),
        FRONTEND_ACTIVATION_PATH: z.string().default("/activate"),
        FRONTEND_BASE_URL: z.url(),
        INTERNAL_JWT_AUDIENCE: z.string(),
        INTERNAL_JWT_ISSUER: z.string(),
        INTERNAL_JWT_KID: z.string(),
        INTERNAL_JWT_SECONDS_DURATION: z.coerce
          .number()
          .int()
          .positive()
          .default(3600),
        INTERNAL_JWT_SUBJECT: z.string(),
        KEYCHAIN_PROCESS_URL: z.url(),
        ORGANIZATION_PROCESS_URL: z.url(),
        PURPOSE_PROCESS_URL: z.url(),
      })
      .transform((c) => ({
        agreementProcessUrl: c.AGREEMENT_PROCESS_URL,
        callerKnodeId: c.CALLER_KNODE_ID,
        eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
        eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
        externalUiSessionMagicLinkJwt: {
          audience: c.EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_AUDIENCE,
          issuer: c.EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_ISSUER,
          kid: c.EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_KID,
          secondsDuration:
            c.EXTERNAL_UI_SESSION_MAGIC_LINK_JWT_SECONDS_DURATION,
        },
        frontendActivationPath: c.FRONTEND_ACTIVATION_PATH,
        frontendBaseUrl: c.FRONTEND_BASE_URL,
        internalJwt: {
          audience: c.INTERNAL_JWT_AUDIENCE,
          issuer: c.INTERNAL_JWT_ISSUER,
          kid: c.INTERNAL_JWT_KID,
          secondsDuration: c.INTERNAL_JWT_SECONDS_DURATION,
          subject: c.INTERNAL_JWT_SUBJECT,
        },
        keychainProcessUrl: c.KEYCHAIN_PROCESS_URL,
        organizationProcessUrl: c.ORGANIZATION_PROCESS_URL,
        purposeProcessUrl: c.PURPOSE_PROCESS_URL,
      })),
  );

export type K2KGatewayConfig = z.infer<typeof K2KGatewayConfig>;

export const config = K2KGatewayConfig.parse(process.env);
