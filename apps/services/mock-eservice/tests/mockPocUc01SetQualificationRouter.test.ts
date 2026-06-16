import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_ID,
  POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_VERSION_ID,
  POC_UC01_SET_QUALIFICATION_MOCK_PRODUCER_ID,
} from "../src/pocUc01/mockup.ts";
import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

// E-service IDs of another mock e-service (signal-hub, mockup 03). A token issued
// for it must NOT be accepted by the setQualification route.
const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);

const SAMPLE_STUDENT = "00132423";
const UNKNOWN_STUDENT = "99999999";

const NEW_QUALIFICATION = {
  EQFLevel: "level06",
  ISCEDFCode: ["06"],
  publisher: {
    legalName: "Academy Orion",
    location: {
      geographicIdentifier: "https://www.geonames.org/3165456",
      geographicName: "Torre del Greco",
    },
  },
  title: "bachelor degree in computer science",
};

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId:
      overrides.eserviceId ?? POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ??
      POC_UC01_SET_QUALIFICATION_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: POC_UC01_SET_QUALIFICATION_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

describe("mock-eservice setQualification router", () => {
  describe("POST /students/:uidStudent/qualifications", () => {
    it("returns 200 with an acknowledgement for a known student", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
        payload: NEW_QUALIFICATION,
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({
        acknowledged: true,
        uidStudent: SAMPLE_STUDENT,
      });
    });

    it("returns 404 for an unknown student", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
        payload: NEW_QUALIFICATION,
        url: `/students/${UNKNOWN_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().title).toBe("student_not_found");
    });

    it("returns 400 for an invalid qualification payload", async () => {
      const token = await signToken();
      const res = await getCtx().app.inject({
        headers: { authorization: `Bearer ${token}` },
        method: "POST",
        payload: { title: "missing required fields" },
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
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
        method: "POST",
        payload: NEW_QUALIFICATION,
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 when the Authorization header is missing", async () => {
      const res = await getCtx().app.inject({
        method: "POST",
        payload: NEW_QUALIFICATION,
        url: `/students/${SAMPLE_STUDENT}/qualifications`,
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
