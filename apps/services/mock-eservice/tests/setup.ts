import type { FastifyInstance } from "fastify";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KnodeId } from "@knodia/common-models/ids";
import {
  createLocalJWKSet,
  type CryptoKey,
  exportJWK,
  generateKeyPair,
} from "jose";
import { afterAll, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";
import "@knodia/test-commons/dynamodb";

export const ACCEPTED_AUDIENCES: [string, ...string[]] = [
  "mock-eservice.knodia.local",
];
export const EXPECTED_ISSUER = "https://knodia.org";
export const TEST_KID = "test-mock-eservice-kid";
export const TEST_KNODE_ID = KnodeId.enum.Orion;

let dynamoClient: DynamoDBClient;
const dynamoDbDpopProofsTable = "knodia-mock-eservice-dpop-proofs";

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

  dynamoClient = new DynamoDBClient({
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
    endpoint: inject("DYNAMODB_CONNECTION_STRING"),
    region: "eu-south-1",
  });

  const app = buildApp({
    config: {
      acceptedAudiences: ACCEPTED_AUDIENCES,
      dpopProofHtuBaseUrl: "http://localhost",
      dpopProofMaxTokenAgeSeconds: 60,
      dynamoDbDpopProofsTable,
      expectedIssuer: EXPECTED_ISSUER,
      host: "test-host",
      isProduction: false,
      jwtClockToleranceSeconds: 30,
      knodeId: TEST_KNODE_ID,
      logLevel: "silent",
      nodeEnv: "test",
      port: 0,
      wellKnownUrls: [],
    },
    dynamoClient,
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
