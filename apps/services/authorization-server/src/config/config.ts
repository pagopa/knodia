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
        ESERVICE_ACCESS_TOKEN_JWT_KID: z.string(),
        GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER: z.url(),
        KNODE_URL: z.url(),
      })
      .transform((c) => ({
        clientAssertionAcceptedAudiences:
          c.CLIENT_ASSERTION_ACCEPTED_AUDIENCES.split(",").map((aud) =>
            aud.trim(),
          ),
        eserviceAccessTokenJwtKid: c.ESERVICE_ACCESS_TOKEN_JWT_KID,
        generatedEserviceAccessTokenIssuer:
          c.GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER,
        knodeUrl: c.KNODE_URL,
      })),
  );

export type AuthorizationServerConfig = z.infer<
  typeof AuthorizationServerConfig
>;

export const config = AuthorizationServerConfig.parse(process.env);
