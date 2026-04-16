import {
  type Agreement,
  AgreementEventV1,
  AgreementState,
  toAgreementV1,
} from "@knodia/agreement-models";
import { generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Agreement } from "../src/models/api.ts";

import {
  getAllAgreementEvents,
  injectAppRequest,
  seedPendingAgreement,
  toExpectAPI_Agreement,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { scope: "agreement-activation", type: "external-ui-session" },
];

describe("POST /agreements/:agreementId/activate", async () => {
  it("should activate a pending agreement", async () => {
    const agreement: Agreement = getMockAgreement({
      state: "PendingConsumerOperatorIdentification",
    });
    await seedPendingAgreement(agreement);

    const response = await injectAppRequest({
      agreementId: agreement.id,
      consumerId: agreement.consumer.id,
      consumerKnodeId: agreement.consumer.knodeId,
      eserviceId: agreement.eserviceId,
      eserviceVersionId: agreement.eserviceVersionId,
      producerId: agreement.producerId,
      type: "external-ui-session",
    })
      .post(`/agreements/${agreement.id}/activate`)
      .body(undefined);

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const responseBody = response.json<API_Agreement>();
    expect(responseBody.state).toBe("Active");

    const expectedAgreement: Agreement = {
      ...agreement,
      state: "Active",
      updatedAt: new Date(responseBody.updatedAt),
    };
    expect(responseBody).toMatchObject(
      toExpectAPI_Agreement(expectedAgreement),
    );

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(2);

    const activationEvent = events[1];
    expect(activationEvent).toMatchObject({
      streamId: agreement.id,
      type: "AgreementActivatedByConsumerOperatorV1",
      version: 1,
    });

    const eventData = AgreementEventV1.parse(activationEvent).data;
    expect(eventData.agreement).toMatchObject(toAgreementV1(expectedAgreement));
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post(`/agreements/${generateId()}/activate`)
        .body(undefined);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 403 for wrong scope", async () => {
    const response = await injectAppRequest({
      scope: "wrong-scope",
      type: "external-ui-session",
    })
      .post(`/agreements/${generateId()}/activate`)
      .body(undefined);
    expect(response.statusCode).toBe(403);
  });

  it("should return 403 when token agreementId does not match path param", async () => {
    const agreement: Agreement = getMockAgreement({
      state: "PendingConsumerOperatorIdentification",
    });
    await seedPendingAgreement(agreement);

    const response = await injectAppRequest({
      agreementId: generateId(),
      consumerId: agreement.consumer.id,
      consumerKnodeId: agreement.consumer.knodeId,
      eserviceId: agreement.eserviceId,
      eserviceVersionId: agreement.eserviceVersionId,
      producerId: agreement.producerId,
      type: "external-ui-session",
    })
      .post(`/agreements/${agreement.id}/activate`)
      .body(undefined);
    expect(response.statusCode).toBe(403);
  });

  it("should return 403 when token resource claims do not match the agreement", async () => {
    const agreement: Agreement = getMockAgreement({
      state: "PendingConsumerOperatorIdentification",
    });
    await seedPendingAgreement(agreement);

    const response = await injectAppRequest({
      agreementId: agreement.id,
      consumerId: agreement.consumer.id,
      consumerKnodeId: agreement.consumer.knodeId,
      eserviceId: generateId(),
      eserviceVersionId: agreement.eserviceVersionId,
      producerId: agreement.producerId,
      type: "external-ui-session",
    })
      .post(`/agreements/${agreement.id}/activate`)
      .body(undefined);
    expect(response.statusCode).toBe(403);
  });

  it("should return 404 when agreement does not exist", async () => {
    const agreementId = generateId();
    const response = await injectAppRequest({
      agreementId,
      type: "external-ui-session",
    })
      .post(`/agreements/${agreementId}/activate`)
      .body(undefined);
    expect(response.statusCode).toBe(404);
  });

  const nonPendingStates = AgreementState.options.filter(
    (state) => state !== "PendingConsumerOperatorIdentification",
  );
  it.each(nonPendingStates)(
    "should return 409 when agreement is in state %s",
    async (state) => {
      const agreement: Agreement = getMockAgreement({ state });
      await seedPendingAgreement({
        ...agreement,
        state,
      });

      const response = await injectAppRequest({
        agreementId: agreement.id,
        consumerId: agreement.consumer.id,
        consumerKnodeId: agreement.consumer.knodeId,
        eserviceId: agreement.eserviceId,
        eserviceVersionId: agreement.eserviceVersionId,
        producerId: agreement.producerId,
        type: "external-ui-session",
      })
        .post(`/agreements/${agreement.id}/activate`)
        .body(undefined);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 400 for malformed agreementId", async () => {
    const response = await injectAppRequest({
      type: "external-ui-session",
    })
      .post("/agreements/not-a-uuid/activate")
      .body(undefined);
    expect(response.statusCode).toBe(400);
  });
});
