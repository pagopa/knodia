import { KnodeId } from "@knodia/common-models/ids";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const MockEserviceConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      ACCEPTED_AUDIENCES: z
        .string()
        .min(1)
        .transform((value) => value.split(",").map((a) => a.trim()))
        .pipe(z.string().array()),
      EXPECTED_ISSUER: z.url(),
      KNODE_ID: KnodeId,
      WELL_KNOWN_URLS: z
        .string()
        .min(1)
        .transform((value) => value.split(",").map((u) => u.trim()))
        .pipe(z.url().array()),
    })
    .transform((c) => ({
      acceptedAudiences: c.ACCEPTED_AUDIENCES,
      expectedIssuer: c.EXPECTED_ISSUER,
      knodeId: c.KNODE_ID,
      wellKnownUrls: c.WELL_KNOWN_URLS,
    })),
);

export type MockEserviceConfig = z.infer<typeof MockEserviceConfig>;

export const config = MockEserviceConfig.parse(process.env);
