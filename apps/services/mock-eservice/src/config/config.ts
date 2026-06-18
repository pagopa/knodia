import { KnodeId } from "@knodia/common-models/ids";
import { SignalHubDbConfig } from "@knodia/db-signal-hub/config";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { RateLimiterConfig } from "@knodia/fastify-zod-api-commons/rate-limit";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

import { SignalHubSeedEnvConfig } from "../signalHub/seedEnvConfig.ts";

const MockEserviceConfig = LoggerConfig.and(HTTPServerConfig)
  .and(SignalHubSeedEnvConfig)
  .and(SignalHubDbConfig)
  .and(RateLimiterConfig)
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
        // POC UC03: relay base URL of each SERC, returned by getERDSMetadata. The
        // relay runs in the producer's infra, reachable by the consumer's client
        // (not on the Knode), so it is environment specific. Defaults target the
        // local multinode mock host ports (Orion 9991, Lynx 9992).
        POC_UC03_RELAY_BASE_URL_LYNX: z.url().default("http://localhost:9992"),
        POC_UC03_RELAY_BASE_URL_ORION: z.url().default("http://localhost:9991"),
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
        pocUc03RelayBaseUrlLynx: c.POC_UC03_RELAY_BASE_URL_LYNX,
        pocUc03RelayBaseUrlOrion: c.POC_UC03_RELAY_BASE_URL_ORION,
        wellKnownUrls: c.WELL_KNOWN_URLS,
      })),
  );

export type MockEserviceConfig = z.infer<typeof MockEserviceConfig>;

export const config = MockEserviceConfig.parse(process.env);
