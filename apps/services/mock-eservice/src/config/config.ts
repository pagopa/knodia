import { KnodeId } from "@knodia/common-models/ids";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { SignalHubSeedEnvConfig } from "@knodia/mock-eservice-signal-hub-commons/config";
import { z } from "zod";

const MockEserviceConfig = LoggerConfig.and(HTTPServerConfig)
  .and(SignalHubSeedEnvConfig)
  .and(
    z
      .object({
        ACCEPTED_AUDIENCES: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((a) => a.trim()))
          .pipe(z.string().array()),
        DPOP_PROOF_HTU_BASE_URL: z.url(),
        DPOP_PROOF_MAX_TOKEN_AGE_SECONDS: z.coerce.number().int().positive(),
        DYNAMODB_DPOP_PROOFS_TABLE: z.string(),
        EXPECTED_ISSUER: z.string(),
        JWT_CLOCK_TOLERANCE_SECONDS: z.coerce.number().int().positive(),
        KNODE_ID: KnodeId,
        WELL_KNOWN_URLS: z
          .string()
          .min(1)
          .transform((value) => value.split(",").map((u) => u.trim()))
          .pipe(z.url().array()),
      })
      .transform((c) => ({
        acceptedAudiences: c.ACCEPTED_AUDIENCES,
        dpopProofHtuBaseUrl: c.DPOP_PROOF_HTU_BASE_URL,
        dpopProofMaxTokenAgeSeconds: c.DPOP_PROOF_MAX_TOKEN_AGE_SECONDS,
        dynamoDbDpopProofsTable: c.DYNAMODB_DPOP_PROOFS_TABLE,
        expectedIssuer: c.EXPECTED_ISSUER,
        jwtClockToleranceSeconds: c.JWT_CLOCK_TOLERANCE_SECONDS,
        knodeId: c.KNODE_ID,
        wellKnownUrls: c.WELL_KNOWN_URLS,
      })),
  );

export type MockEserviceConfig = z.infer<typeof MockEserviceConfig>;

export const config = MockEserviceConfig.parse(process.env);
