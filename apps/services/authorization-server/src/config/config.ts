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
        CLIENT_ASSERTION_ACCEPTED_AUDIENCES: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((a) => a.trim()))
          .pipe(z.string().array()),
        CLIENT_ASSERTION_CLOCK_TOLERANCE_SECONDS: z.coerce
          .number()
          .int()
          .positive(),
        CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS: z.coerce
          .number()
          .int()
          .positive(),
        CONSUMER_KNODE_URL: z.url(),
        DPOP_PROOF_HTU_BASE_URL: z.url(),
        DPOP_PROOF_MAX_TOKEN_AGE_SECONDS: z.coerce.number().int().positive(),
        DYNAMODB_DPOP_PROOFS_TABLE: z.string(),
        ESERVICE_ACCESS_TOKEN_JWT_KID: z.string(),
        GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER: z.url(),
        KNODE_ID: KnodeId,
      })
      .transform((c) => ({
        clientAssertionAcceptedAudiences: c.CLIENT_ASSERTION_ACCEPTED_AUDIENCES,
        clientAssertionClockToleranceSeconds:
          c.CLIENT_ASSERTION_CLOCK_TOLERANCE_SECONDS,
        clientAssertionMaxTokenAgeSeconds:
          c.CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS,
        consumerKnodeUrl: c.CONSUMER_KNODE_URL,
        dpopProofHtuBaseUrl: c.DPOP_PROOF_HTU_BASE_URL,
        dpopProofMaxTokenAgeSeconds: c.DPOP_PROOF_MAX_TOKEN_AGE_SECONDS,
        dynamoDbDpopProofsTable: c.DYNAMODB_DPOP_PROOFS_TABLE,
        eserviceAccessTokenJwtKid: c.ESERVICE_ACCESS_TOKEN_JWT_KID,
        generatedEserviceAccessTokenIssuer:
          c.GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER,
        knodeId: c.KNODE_ID,
      })),
  );

export type AuthorizationServerConfig = z.infer<
  typeof AuthorizationServerConfig
>;

export const config = AuthorizationServerConfig.parse(process.env);
