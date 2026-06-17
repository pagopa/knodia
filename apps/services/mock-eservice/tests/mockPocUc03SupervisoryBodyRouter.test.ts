import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import {
  POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
  POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
  POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID,
  POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID,
  POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID,
} from "../src/pocUc03Erds/mockup.ts";
import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);

const RECIPIENT_VAT = "01229430085";
const SENDER_FISCAL_CODE = "MRARSS80A01L259A";

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId: overrides.eserviceId ?? POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID,
    eserviceVersionId:
      overrides.eserviceVersionId ??
      POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID,
    knodeId: TEST_KNODE_ID,
    producerId: POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

describe("GET /erds (lookupERDS)", () => {
  it("resolves the recipient's SERC", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: `/erds?identifier=${RECIPIENT_VAT}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ erdsIdentifier: "systemSERCOrion" });
  });

  it("resolves the sender's SERC", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: `/erds?identifier=${SENDER_FISCAL_CODE}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ erdsIdentifier: "systemSERCLynx" });
  });

  it("returns 404 for an unknown recipient", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: "/erds?identifier=99999999999",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().title).toBe("erds_recipient_not_found");
  });

  it("returns 400 when identifier is missing", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: "/erds",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await getCtx().app.inject({
      method: "GET",
      url: `/erds?identifier=${RECIPIENT_VAT}`,
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token issued for a different mock e-service", async () => {
    const token = await signToken({
      eserviceId: OTHER_MOCK_ESERVICE_ID,
      eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
    });
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: `/erds?identifier=${RECIPIENT_VAT}`,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /erds/:erdsIdentifier/metadata (getERDSMetadata)", () => {
  it("returns the Orion SERC metadata with its relay URL", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: "/erds/systemSERCOrion/metadata",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      domainName: "http://localhost:9991",
      eserviceId: POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
      identifier: "systemSERCOrion",
      knodeId: "Orion",
    });
  });

  it("returns the Lynx SERC metadata with its relay URL", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: "/erds/systemSERCLynx/metadata",
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      domainName: "http://localhost:9992",
      eserviceId: POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
      identifier: "systemSERCLynx",
      knodeId: "Lynx",
    });
  });

  it("returns 404 for an unknown erdsIdentifier", async () => {
    const token = await signToken();
    const res = await getCtx().app.inject({
      headers: { authorization: `Bearer ${token}` },
      method: "GET",
      url: "/erds/systemSERCUnknown/metadata",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().title).toBe("erds_not_found");
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await getCtx().app.inject({
      method: "GET",
      url: "/erds/systemSERCOrion/metadata",
    });
    expect(res.statusCode).toBe(401);
  });
});
