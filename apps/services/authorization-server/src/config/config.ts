import { KnodeId } from "@knodia/common-models/ids";
import { TargetKnodeUrls } from "@knodia/common-models/targetKnodeUrls";
import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { ReadmodelKeychainConfig } from "@knodia/db-readmodel-keychain/config";
import { ReadmodelPurposeConfig } from "@knodia/db-readmodel-purpose/config";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const AuthorizationServerConfig = LoggerConfig.and(HTTPServerConfig)
  .and(ReadmodelAgreementConfig)
  .and(ReadmodelEserviceConfig)
  .and(ReadmodelKeychainConfig)
  .and(ReadmodelPurposeConfig)
  .and(
    z
      .object({
        CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS: z.coerce
          .number()
          .int()
          .positive(),
        DPOP_PROOF_HTU_BASE_URL: z.url(),
        DPOP_PROOF_MAX_TOKEN_AGE_SECONDS: z.coerce.number().int().positive(),
        DYNAMODB_DPOP_PROOFS_TABLE: z.string(),
        ESERVICE_ACCESS_TOKEN_JWT_KID: z.string(),
        ESERVICE_CLIENT_ASSERTION_ACCEPTED_AUDIENCES: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((a) => a.trim()))
          .pipe(z.string().array()),
        GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER: z.string(),
        GENERATED_KNODE_API_TOKEN_AUDIENCE: z.string().min(1),
        GENERATED_KNODE_API_TOKEN_ISSUER: z.string(),
        JWT_CLOCK_TOLERANCE_SECONDS: z.coerce.number().int().positive(),
        KNODE_API_CLIENT_ASSERTION_ACCEPTED_AUDIENCES: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((a) => a.trim()))
          .pipe(z.string().array()),
        KNODE_API_TOKEN_DURATION_SECONDS: z.coerce.number().int().positive(),
        KNODE_API_TOKEN_JWT_KID: z.string(),
        KNODE_ID: KnodeId,
        TARGET_KNODE_URLS: TargetKnodeUrls,
      })
      .transform((c) => ({
        clientAssertionMaxTokenAgeSeconds:
          c.CLIENT_ASSERTION_MAX_TOKEN_AGE_SECONDS,
        dpopProofHtuBaseUrl: c.DPOP_PROOF_HTU_BASE_URL,
        dpopProofMaxTokenAgeSeconds: c.DPOP_PROOF_MAX_TOKEN_AGE_SECONDS,
        dynamoDbDpopProofsTable: c.DYNAMODB_DPOP_PROOFS_TABLE,
        eserviceAccessTokenJwtKid: c.ESERVICE_ACCESS_TOKEN_JWT_KID,
        eserviceClientAssertionAcceptedAudiences:
          c.ESERVICE_CLIENT_ASSERTION_ACCEPTED_AUDIENCES,
        generatedEserviceAccessTokenIssuer:
          c.GENERATED_ESERVICE_ACCESS_TOKEN_ISSUER,
        generatedKnodeApiTokenAudience: c.GENERATED_KNODE_API_TOKEN_AUDIENCE,
        generatedKnodeApiTokenIssuer: c.GENERATED_KNODE_API_TOKEN_ISSUER,
        jwtClockToleranceSeconds: c.JWT_CLOCK_TOLERANCE_SECONDS,
        knodeApiClientAssertionAcceptedAudiences:
          c.KNODE_API_CLIENT_ASSERTION_ACCEPTED_AUDIENCES,
        knodeApiTokenDurationSeconds: c.KNODE_API_TOKEN_DURATION_SECONDS,
        knodeApiTokenJwtKid: c.KNODE_API_TOKEN_JWT_KID,
        knodeId: c.KNODE_ID,
        targetKnodeUrls: c.TARGET_KNODE_URLS,
      })),
  );

export type AuthorizationServerConfig = z.infer<
  typeof AuthorizationServerConfig
>;

export const config = AuthorizationServerConfig.parse(process.env);
