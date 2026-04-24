import type { FastifyInstance } from "fastify";

import {
  createLocalJWKSet,
  type CryptoKey,
  exportJWK,
  generateKeyPair,
} from "jose";
import { afterAll, beforeAll } from "vitest";

import { buildApp } from "../src/app.ts";

export const ACCEPTED_AUDIENCES: [string, ...string[]] = [
  "mock-eservice.knodia.local",
];
export const EXPECTED_ISSUER = "https://knodia.org";
export const TEST_KID = "test-mock-eservice-kid";

interface TestContext {
  app: FastifyInstance;
  privateKey: CryptoKey;
}

let ctx: TestContext;

beforeAll(async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const jwk = await exportJWK(publicKey);
  jwk.kid = TEST_KID;
  jwk.alg = "RS256";
  jwk.use = "sig";

  const app = buildApp({
    acceptedAudiences: ACCEPTED_AUDIENCES,
    config: { isProduction: false, logLevel: "silent", nodeEnv: "test" },
    expectedIssuer: EXPECTED_ISSUER,
    jwksResolvers: [createLocalJWKSet({ keys: [jwk] })],
  });
  await app.ready();

  ctx = { app, privateKey };
});

afterAll(async () => {
  await ctx.app.close();
});

export function getCtx(): TestContext {
  return ctx;
}
