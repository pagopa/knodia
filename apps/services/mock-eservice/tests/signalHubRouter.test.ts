import { type EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  type ConsumerKeychainId,
  type EserviceId,
  type EserviceVersionId,
  generateId,
  KnodeId,
  type OrganizationId,
  type PurposeId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { SignJWT } from "jose";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCEPTED_AUDIENCES,
  EXPECTED_ISSUER,
  getCtx,
  TEST_KID,
  TEST_KNODE_ID,
} from "./setup.ts";

// Same hardcoded identity as apps/services/mock-eservice/src/routers/mockSignalHubRouter.ts
const EXPECTED_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const EXPECTED_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);
const EXPECTED_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);

// E-service IDs of the other mock e-services (mockup 01 bearer). A token issued
// for those must NOT be accepted by /residence or /pseudonymization.
const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "e7f5837e-75f4-431d-9465-73366d27bef2",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "29721f0d-e36e-4157-bcdc-9629ace0f85b",
);

const ROTATING_NOTATION = "RMNLNR03H12H501Z";
const UNKNOWN_NOTATION = "AAAAAA00A00A000A";
const OTHER_KNODE_ID = KnodeId.enum.Lynx;

// setup.ts pins seedStartDateMs=0, seedExpireSeconds=30 so wall-clock ms maps
// straight to periodId: T = 15_000 ⇒ periodId 0, T = 45_000 ⇒ periodId 1, ...
const PERIOD_MS = 30_000;

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  const {
    tokenKeys: { tokenPrivateKey },
  } = getCtx();

  const now = Math.floor(Date.now() / 1000);
  const payload: Partial<EserviceAccessTokenClaims> = {
    client_id: generateId<ConsumerKeychainId>(),
    consumer: {
      id: generateExternalId<OrganizationId>(),
      knode_id: OTHER_KNODE_ID,
    },
    eservice: {
      id: overrides.eserviceId ?? EXPECTED_ESERVICE_ID,
      knode_id: TEST_KNODE_ID,
      version: overrides.eserviceVersionId ?? EXPECTED_ESERVICE_VERSION_ID,
    },
    nbf: now,
    producer: { id: EXPECTED_PRODUCER_ID, knode_id: TEST_KNODE_ID },
    purpose: { id: generateId<PurposeId>(), knode_id: OTHER_KNODE_ID },
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: TEST_KID, typ: "at+jwt" })
    .setSubject(randomUUID())
    .setIssuer(EXPECTED_ISSUER)
    .setAudience(ACCEPTED_AUDIENCES)
    .setJti(randomUUID())
    .setIssuedAt(now)
    .setExpirationTime("5m")
    .sign(tokenPrivateKey);
}

describe("mock-eservice Signal Hub router", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      // Don't fake setTimeout/setInterval — fastify's internal scheduling would
      // hang under fake timers. Only override Date so computePeriodId is
      // deterministic.
      toFake: ["Date"],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GET /natural-persons/:notation/residence", () => {
    it("returns 200 with address A in the CREATE phase (periodId 0)", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.naturalPerson.identifier.notation).toBe(ROTATING_NOTATION);
      expect(body.address.fullAddress).toMatch(/Via del Corso/);
    });

    it("returns 200 with address B in the UPDATE phase (periodId 1)", async () => {
      vi.setSystemTime(PERIOD_MS * 1 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().address.fullAddress).toMatch(/Via Veneto/);
    });

    it("returns 404 in the DELETE phase (periodId 2)", async () => {
      vi.setSystemTime(PERIOD_MS * 2 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("wraps back to the CREATE phase at periodId 3", async () => {
      vi.setSystemTime(PERIOD_MS * 3 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().address.fullAddress).toMatch(/Via del Corso/);
    });

    it("returns 404 for an unknown notation", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${UNKNOWN_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("returns 401 for a token issued for a different mock e-service", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const token = await signToken({
        eserviceId: OTHER_MOCK_ESERVICE_ID,
        eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
      });
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const res = await getCtx().app.inject({
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /pseudonymization", () => {
    it("returns 200 with the seed for the current period", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: "/pseudonymization",
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.cryptoHashFunction).toBe("sha256");
      expect(typeof body.seed).toBe("string");
      expect(body.seed).toHaveLength(16);
    });

    it("yields three distinct seeds across three consecutive periods", async () => {
      vi.setSystemTime(0);
      const token = await signToken();
      const seeds = [];
      for (const p of [0, 1, 2]) {
        vi.setSystemTime(PERIOD_MS * p + 1_000);
        const res = await getCtx().app.inject({
          headers: { authorization: `Bearer ${token}` },
          method: "GET",
          url: "/pseudonymization",
        });
        expect(res.statusCode).toBe(200);
        seeds.push(res.json().seed);
      }
      expect(new Set(seeds).size).toBe(3);
    });

    it("returns 401 for a token issued for a different mock e-service", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const token = await signToken({
        eserviceId: OTHER_MOCK_ESERVICE_ID,
        eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
      });
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: "/pseudonymization",
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      vi.setSystemTime(PERIOD_MS * 0 + 1_000);
      const res = await getCtx().app.inject({
        method: "GET",
        url: "/pseudonymization",
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
