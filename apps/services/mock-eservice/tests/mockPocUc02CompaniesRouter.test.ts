import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  POC_UC02_COMPANIES_MOCK_ESERVICE_ID,
  POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID,
  POC_UC02_COMPANIES_MOCK_PRODUCER_ID,
} from "../src/pocUc02Companies/mockup.ts";
import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

// E-service IDs of another mock e-service (signal-hub, mockup 03). A token issued
// for it must NOT be accepted by the companies routes.
const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);

const SAMPLE_VAT = "01229430085";
const UNKNOWN_VAT = "00000000000";
const INVALID_VAT = "not-a-vat";

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId: overrides.eserviceId ?? POC_UC02_COMPANIES_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ??
      POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: POC_UC02_COMPANIES_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

describe("mock-eservice companies router", () => {
  describe("GET /legal-entities/:uidCompany/information", () => {
    it("returns 200 with the legal entity for a known company", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/information`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.legalName).toBe("TUTTO - KLIMA SRL");
      expect(body.legalEntityActivity).toBe("43.22.07");
      expect(body.registrationDate).toBe("2012-07-09");
      expect(body.legalIdentifier).toEqual({
        notation: SAMPLE_VAT,
        schemeName: "Partita Iva",
        schemeURI: "http://memberstate.ms/VAT",
      });
    });

    it("returns 404 for an unknown company", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${UNKNOWN_VAT}/information`,
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().title).toBe("legal_entity_not_found");
    });

    it("returns 400 for a malformed VAT", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${INVALID_VAT}/information`,
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
        url: `/legal-entities/${SAMPLE_VAT}/information`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      const res = await getCtx().app.inject({
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/information`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /legal-entities/:uidCompany/evidences", () => {
    it("returns 200 with the evidences for a known company", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/evidences`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
      const [evidence] = body;
      expect(evidence.isAbout.legalName).toBe("TUTTO - KLIMA SRL");
      expect(evidence.isConformantTo).toEqual({
        evidenceTypeClassification: "codeETC_001",
        identifier: "complianceLegalObligations",
      });
      expect(evidence.validityPeriod.starttime).toBe("2020-01-01");
      expect(evidence.validityPeriod.endtime).toBe("2030-12-31");
    });

    it("filters by evidenceType", async () => {
      const token = await signToken();
      const matching = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/evidences?evidenceType=codeETC_001`,
      });
      expect(matching.statusCode).toBe(200);
      expect(matching.json()).toHaveLength(1);

      const nonMatching = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/evidences?evidenceType=codeETC_002`,
      });
      expect(nonMatching.statusCode).toBe(200);
      expect(nonMatching.json()).toHaveLength(0);
    });

    it("returns 404 for an unknown company", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${UNKNOWN_VAT}/evidences`,
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().title).toBe("legal_entity_not_found");
    });

    it("returns 401 for a token issued for a different mock e-service", async () => {
      const token = await signToken({
        eserviceId: OTHER_MOCK_ESERVICE_ID,
        eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
      });
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/evidences`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      const res = await getCtx().app.inject({
        method: "GET",
        url: `/legal-entities/${SAMPLE_VAT}/evidences`,
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
