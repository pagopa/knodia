import type { FastifyInstance } from "fastify";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Algorithm } from "@knodia/common-models/crypto";
import { KnodeId } from "@knodia/common-models/ids";
import { generateKeySet } from "@knodia/test-commons/utils";
import {
  createLocalJWKSet,
  type CryptoKey,
  exportJWK,
  generateKeyPair,
} from "jose";
import { afterAll, beforeAll, inject } from "vitest";

import { buildApp } from "../src/app.ts";
import "@knodia/test-commons/dynamodb";

export const ACCEPTED_AUDIENCES: [string, ...string[]] = ["test.audience"];
export const EXPECTED_ISSUER = "knodia.org";
export const TEST_KID = "test-mock-eservice-kid";
export const TEST_KNODE_ID = KnodeId.enum.Orion;

let dynamoClient: DynamoDBClient;
const dynamoDbDpopProofsTable = "knodia-mock-eservice-dpop-proofs";

interface TestContext {
  app: FastifyInstance;
  dpopKeys: {
    dpopKeySet: ReturnType<typeof generateKeySet>["keySet"];
    dpopPublicKeyJwk: JsonWebKey;
  };
  tokenKeys: {
    tokenPrivateKey: CryptoKey;
    tokenPublicKey: CryptoKey;
  };
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
      seedExpireSeconds: 30,
      seedSaltLength: 16,
      seedStartDateMs: 0,
      wellKnownUrls: [],
    },
    dynamoClient,
    jwksResolvers: [createLocalJWKSet({ keys: [jwk] })],
  });
  await app.ready();

  const { keySet: dpopKeySet, publicKeyJwk: dpopPublicKeyJwk } = generateKeySet(
    Algorithm.enum.ES256,
  );

  ctx = {
    app,
    dpopKeys: {
      dpopKeySet,
      dpopPublicKeyJwk,
    },
    tokenKeys: {
      tokenPrivateKey: privateKey,
      tokenPublicKey: publicKey,
    },
  };
});

afterAll(async () => {
  await ctx.app.close();
});

export function getCtx(): TestContext {
  return ctx;
}
