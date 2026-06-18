import {
  type EserviceId,
  type EserviceVersionId,
  unsafeBrandId,
} from "@knodia/common-models/ids";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { POC_UC03_RELAY_IDENTITY_BY_KNODE } from "../src/pocUc03Erds/mockup.ts";
import { getCtx, TEST_KNODE_ID } from "./setup.ts";
import { signEserviceAccessToken } from "./utils.ts";

// TEST_KNODE_ID is Orion, so the relay served is the Orion SERC's e-service.
const RELAY = POC_UC03_RELAY_IDENTITY_BY_KNODE[TEST_KNODE_ID];

const OTHER_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
const OTHER_MOCK_ESERVICE_VERSION_ID = unsafeBrandId<EserviceVersionId>(
  "fa2a800a-5058-4859-b68a-bfbd3ee863c0",
);

function dispatchPayload() {
  return {
    evidence: {
      eventIdentifier: "SubmissionAcceptance",
      eventReason: "MessageAccepted",
      eventTime: "2026-05-21T12:11:00Z",
      evidenceIdentifier: {
        erdsIdentifier: "systemSERCOrion",
        uuid: randomUUID(),
      },
      version: "KNODIAUSECASE",
    },
    relayMetadata: {
      messageIdentifier: {
        erdsIdentifier: "systemSERCOrion",
        uuid: randomUUID(),
      },
      messageType: "Dispatch",
      recipientIdentifier: {
        notation: "01229430085",
        schemeName: "Partita Iva",
        schemeURI: "http://memberstate.ms/VAT",
      },
      senderIdentifier: {
        notation: "MRARSS80A01L259A",
        schemeName: "Codice Fiscale",
        schemeURI: "http://memberstate.ms/PIdentifier",
      },
      userContentInformation: "text",
      version: "KNODIAUSECASE",
    },
    userContent: { body: "Testo del messaggio inoltrato", subject: "Notifica" },
  };
}

async function signToken(
  overrides: {
    eserviceId?: EserviceId;
    eserviceVersionId?: EserviceVersionId;
  } = {},
) {
  return signEserviceAccessToken({
    eserviceId: overrides.eserviceId ?? RELAY.eserviceId,
    eserviceVersionId: overrides.eserviceVersionId ?? RELAY.eserviceVersionId,
    knodeId: TEST_KNODE_ID,
    producerId: RELAY.producerId,
    tokenPrivateKey: getCtx().tokenKeys.tokenPrivateKey,
  });
}

describe("POST /relay", () => {
  it("accepts a Dispatch and acknowledges it", async () => {
    const token = await signToken();
    const body = dispatchPayload();
    const res = await getCtx().app.inject({
      body,
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: "/relay",
    });
    expect(res.statusCode).toBe(200);
    const ack = res.json();
    expect(ack.messageIdentifier).toEqual(body.relayMetadata.messageIdentifier);
    expect(ack.correlationId).toEqual(expect.any(String));
    expect(ack.receivedAt).toEqual(expect.any(String));
  });

  it("accepts a Receipt carrying a relay-acceptance evidence", async () => {
    const token = await signToken();
    const body = dispatchPayload();
    body.relayMetadata.messageType = "Receipt";
    body.evidence.eventIdentifier = "RelayAcceptance";
    body.evidence.eventReason = "MessageSuccessfullyRelayed";
    const res = await getCtx().app.inject({
      body,
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: "/relay",
    });
    expect(res.statusCode).toBe(200);
  });

  it("returns 400 when eventReason does not match eventIdentifier", async () => {
    const token = await signToken();
    const body = dispatchPayload();
    body.evidence.eventReason = "MessageHandoverToRecipient";
    const res = await getCtx().app.inject({
      body,
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: "/relay",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for a malformed erd_dispatch (missing relayMetadata)", async () => {
    const token = await signToken();
    const { relayMetadata, ...rest } = dispatchPayload();
    void relayMetadata;
    const res = await getCtx().app.inject({
      body: rest,
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: "/relay",
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const res = await getCtx().app.inject({
      body: dispatchPayload(),
      method: "POST",
      url: "/relay",
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token issued for a different mock e-service", async () => {
    const token = await signToken({
      eserviceId: OTHER_MOCK_ESERVICE_ID,
      eserviceVersionId: OTHER_MOCK_ESERVICE_VERSION_ID,
    });
    const res = await getCtx().app.inject({
      body: dispatchPayload(),
      headers: { authorization: `Bearer ${token}` },
      method: "POST",
      url: "/relay",
    });
    expect(res.statusCode).toBe(401);
  });
});
