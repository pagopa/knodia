import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SIGNAL_HUB_MOCK_ESERVICE_ID,
  SIGNAL_HUB_MOCK_ESERVICE_VERSION_ID,
  SIGNAL_HUB_MOCK_PRODUCER_ID,
} from "../src/signalHub/mockup.ts";
import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

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

// setup.ts pins signalHubSeedStartDateMs=0, signalHubSeedExpireSeconds=30 so wall-clock ms maps
// straight to periodId: T = 15_000 ⇒ periodId 0, T = 45_000 ⇒ periodId 1, ...
const PERIOD_MS = 30_000;

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId: overrides.eserviceId ?? SIGNAL_HUB_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ?? SIGNAL_HUB_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: SIGNAL_HUB_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
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
    it("returns 200 with address A in the Create phase (periodId 0)", async () => {
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
      expect(body.address.fullAddress).toMatch(/Napoli/);
    });

    it("returns 200 with address B in the Update phase (periodId 1)", async () => {
      vi.setSystemTime(PERIOD_MS * 1 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().address.fullAddress).toMatch(/Mestre/);
    });

    it("returns 404 in the Delete phase (periodId 2)", async () => {
      vi.setSystemTime(PERIOD_MS * 2 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(404);
    });

    it("wraps back to the Create phase at periodId 3", async () => {
      vi.setSystemTime(PERIOD_MS * 3 + 1_000);
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/natural-persons/${ROTATING_NOTATION}/residence`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().address.fullAddress).toMatch(/Napoli/);
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
