import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_ID,
  POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_VERSION_ID,
  POC_UC01_QUALIFICATIONS_MOCK_PRODUCER_ID,
} from "../src/pocUc01Qualifications/mockup.ts";
import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

// E-service IDs of another mock e-service (signal-hub, mockup 03). A token issued
// for it must NOT be accepted by the qualifications routes.
const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);

const SAMPLE_STUDENT = "00132423";
const UNKNOWN_STUDENT = "99999999";
const INVALID_STUDENT = "not-a-student";

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId:
      overrides.eserviceId ?? POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ??
      POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: POC_UC01_QUALIFICATIONS_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

describe("mock-eservice qualifications router", () => {
  describe("GET /students/:uidStudent/qualifications", () => {
    it("returns 200 with the qualifications for a known student", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
      const [qualification] = body;
      expect(qualification.EQFLevel).toBe("level04");
      expect(qualification.ISCEDFCode).toEqual(["06"]);
      expect(qualification.title).toBe("high school diploma");
      expect(qualification.publisher.legalName).toBe(
        "Istituto Tecnico E. Pantaleo",
      );
      // The route is behind the rate-limit plugin; assert the limiter ran.
      expect(res.headers["x-ratelimit-limit"]).toBeDefined();
      expect(res.headers["x-ratelimit-remaining"]).toBeDefined();
      expect(res.headers["x-ratelimit-degraded"]).toBeUndefined();
    });

    it("filters by iscedfCode", async () => {
      const token = await signToken();
      const matching = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${SAMPLE_STUDENT}/qualifications?iscedfCode=06`,
      });
      expect(matching.statusCode).toBe(200);
      expect(matching.json()).toHaveLength(1);

      const nonMatching = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${SAMPLE_STUDENT}/qualifications?iscedfCode=01`,
      });
      expect(nonMatching.statusCode).toBe(200);
      expect(nonMatching.json()).toHaveLength(0);
    });

    it("returns 404 for an unknown student", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${UNKNOWN_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().title).toBe("student_not_found");
    });

    it("returns 400 for a malformed uidStudent", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${INVALID_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(400);
    });

    it("returns 400 for an invalid iscedfCode", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${SAMPLE_STUDENT}/qualifications?iscedfCode=99`,
      });
      expect(res.statusCode).toBe(400);
    });

    it("returns 401 for a token issued for a different mock e-service", async () => {
      const token = await signToken({
        eserviceId: OTHER_MOCK_ESERVICE_ID,
        eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
      });
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      const res = await getCtx().app.inject({
        method: "GET",
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
