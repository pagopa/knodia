/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Agreement, AgreementState } from "@knodia/agreement-models";

import {
  type AgreementId,
  generateId,
  KnodeId,
} from "@knodia/common-models/ids";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_AgreementActivationClaims } from "../src/models/api.ts";

import { eservice1 } from "./mockAgreements.ts";
import {
  injectAppRequest,
  seedAgreement,
  seedPendingAgreement,
} from "./utils.ts";

// agreement-process test setup configures currentKnodeId = "Orion"; assertions
// below depend on that.
const LOCAL_KNODE_ID = KnodeId.enum.Orion;

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const consumerKnodeId = KnodeId.enum.Lynx;

const pendingAgreement: Agreement = {
  ...getMockAgreement({
    seed: 100,
    state: "PendingConsumerOperatorIdentification",
  }),
  consumer: {
    ...getMockAgreement({ seed: 100 }).consumer,
    knodeId: consumerKnodeId,
  },
  eserviceId: eservice1.id,
  eserviceVersionId: eservice1.versions[0]!.id,
  producerId: eservice1.producerId,
};

const getActivationClaims = (
  agreementId: string,
  token: TestToken = allowedTestTokens[0]!,
) => injectAppRequest(token).get(`/agreements/${agreementId}/activationClaims`);

describe("GET /agreements/:agreementId/activationClaims (getAgreementActivationClaims)", () => {
  it("returns the claims projection for a pending agreement", async () => {
    await seedPendingAgreement(pendingAgreement);

    const response = await getActivationClaims(pendingAgreement.id);

    expect(response.statusCode).toBe(200);
    const body = response.json<API_AgreementActivationClaims>();
    expect(body).toEqual({
      agreement: { id: pendingAgreement.id, knodeId: LOCAL_KNODE_ID },
      consumer: {
        id: pendingAgreement.consumer.id,
        knodeId: consumerKnodeId,
      },
      eservice: {
        id: pendingAgreement.eserviceId,
        knodeId: LOCAL_KNODE_ID,
        version: pendingAgreement.eserviceVersionId,
      },
      producer: { id: pendingAgreement.producerId, knodeId: LOCAL_KNODE_ID },
    });
  });

  it.each<AgreementState>(["Active", "Suspended", "Archived"])(
    "returns 409 when the agreement is in non-pending state %s",
    async (state) => {
      const agreement: Agreement = { ...pendingAgreement, state };
      await seedAgreement(agreement);

      const response = await getActivationClaims(agreement.id);

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the agreement does not exist", async () => {
    const response = await getActivationClaims(generateId<AgreementId>());
    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for invalid agreement id format", async () => {
    const response = await getActivationClaims("not-a-uuid");
    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (token) => {
      await seedPendingAgreement(pendingAgreement);
      const response = await getActivationClaims(pendingAgreement.id, token);
      expect(response.statusCode).toBe(403);
    },
  );
});
