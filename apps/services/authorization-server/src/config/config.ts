import { KnodeId } from "@knodia/common-models/ids";
import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { ReadmodelPurposeConfig } from "@knodia/db-readmodel-purpose/config";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const AuthorizationServerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(ReadmodelAgreementConfig)
  .and(ReadmodelEserviceConfig)
  .and(ReadmodelPurposeConfig)
  .and(
    z
      .object({
        CLIENT_ASSERTION_ACCEPTED_AUDIENCES: z.string(),
        CLIENT_ASSERTION_CLOCK_TOLERANCE_SECONDS: z.coerce
          .number()
          .int()
          .positive(),
        CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS: z.coerce
          .number()
          .int()
          .positive(),
        ESERVICE_ACCESS_TOKEN_JWT_KID: z.string(),
        GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER: z.url(),
        KNODE_ID: KnodeId,
        KNODE_URL: z.url(),
      })
      .transform((c) => ({
        clientAssertionAcceptedAudiences:
          c.CLIENT_ASSERTION_ACCEPTED_AUDIENCES.split(",").map((aud) =>
            aud.trim(),
          ),
        clientAssertionClockToleranceSeconds:
          c.CLIENT_ASSERTION_CLOCK_TOLERANCE_SECONDS,
        clientAssertionMaxTokenAgeSeconds:
          c.CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS,
        eserviceAccessTokenJwtKid: c.ESERVICE_ACCESS_TOKEN_JWT_KID,
        generatedEserviceAccessTokenIssuer:
          c.GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER,
        knodeId: c.KNODE_ID,
        knodeUrl: c.KNODE_URL,
      })),
  );

export type AuthorizationServerConfig = z.infer<
  typeof AuthorizationServerConfig
>;

export const config = AuthorizationServerConfig.parse(process.env);
