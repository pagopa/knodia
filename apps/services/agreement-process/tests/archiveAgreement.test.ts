/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type Agreement,
  AgreementEventV1,
  type AgreementState,
  fromAgreementV1,
} from "@knodia/agreement-models";
import { type AgreementId, generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Agreement } from "../src/models/api.ts";

import {
  getAllAgreementEvents,
  injectAppRequest,
  seedAgreement,
} from "./utils.ts";

const internalToken: TestToken = { type: "internal" };
const consumerAllowedTokens: TestToken[] = [internalToken];

const notArchivableStates: AgreementState[] = [
  "Active",
  "Archived",
  "PendingConsumerOperatorIdentification",
];

function makeAgreement(overrides: Partial<Agreement>): Agreement {
  return {
    ...getMockAgreement(),
    state: "Suspended",
    suspendedByConsumerAt: new Date(),
    suspendedByProducerAt: null,
    ...overrides,
  };
}

describe("POST /agreements/:agreementId/archive", () => {
  it("archives a suspended-by-consumer agreement", async () => {
    const agreement = makeAgreement({ id: generateId<AgreementId>() });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/archive`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Archived");

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: agreement.id,
      type: "AgreementArchivedV1",
      version: 1,
    });

    const eventData = AgreementEventV1.parse(events[1]).data;
    const agreementFromEvent = fromAgreementV1(eventData.agreement!);
    expect(agreementFromEvent.state).toBe("Archived");
  });

  it("archives a suspended-by-producer agreement", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      suspendedByConsumerAt: null,
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/archive`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Archived");
  });

  it("archives an agreement suspended by both consumer and producer", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      suspendedByConsumerAt: new Date(),
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/archive`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Archived");
  });

  it.each(notArchivableStates)(
    "returns 409 when the agreement is %s",
    async (state) => {
      const agreement = makeAgreement({
        id: generateId<AgreementId>(),
        state,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
      });
      await seedAgreement(agreement);

      const response = await injectAppRequest(internalToken).post(
        `/agreements/${agreement.id}/archive`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the agreement does not exist", async () => {
    const response = await injectAppRequest(internalToken).post(
      `/agreements/${generateId<AgreementId>()}/archive`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(consumerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const agreement = makeAgreement({ id: generateId<AgreementId>() });
      await seedAgreement(agreement);

      const response = await injectAppRequest(spec).post(
        `/agreements/${agreement.id}/archive`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
