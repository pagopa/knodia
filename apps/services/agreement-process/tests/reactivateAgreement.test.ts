import { type Agreement, type AgreementState } from "@knodia/agreement-models";
import {
  type AgreementId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Agreement } from "../src/models/api.ts";

import {
  getAllAgreementEvents,
  injectAppRequest,
  seedAgreement,
} from "./utils.ts";

const internalToken: TestToken = { type: "internal" };
const producerToken: TestToken = {
  roles: ["administrative"],
  type: "ui-session",
};
const consumerAllowedTokens: TestToken[] = [internalToken];
const producerAllowedTokens: TestToken[] = [producerToken];

const notAllowedStates: AgreementState[] = [
  "Archived",
  "PendingConsumerOperatorIdentification",
];

function makeSuspendedAgreement(
  overrides: Partial<Agreement> & {
    suspendedByConsumerAt?: Date | null;
    suspendedByProducerAt?: Date | null;
  },
): Agreement {
  return {
    ...getMockAgreement(),
    producerId: TEST_ORGANIZATION_ID,
    state: "Suspended",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: null,
    ...overrides,
  };
}

describe("POST /agreements/:agreementId/reactivateByProducer", () => {
  it("reactivates an agreement suspended only by producer -> Active", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00Z");
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      suspendedByProducerAt: suspendedAt,
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(producerToken).post(
      `/agreements/${agreement.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Active");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: agreement.id,
      type: "AgreementReactivatedByProducerV1",
      version: 1,
    });
  });

  it("reactivates one side of a fully-suspended agreement - stays Suspended", async () => {
    const suspendedByProducerAt = new Date("2026-01-01T00:00:00Z");
    const suspendedByConsumerAt = new Date("2026-01-02T00:00:00Z");
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      suspendedByConsumerAt,
      suspendedByProducerAt,
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(producerToken).post(
      `/agreements/${agreement.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByProducerAt).toBeNull();
    expect(body.suspendedByConsumerAt).toBe(
      suspendedByConsumerAt.toISOString(),
    );
  });

  it("returns 409 when producer tries to reactivate an Active agreement", async () => {
    const agreement: Agreement = {
      ...getMockAgreement(),
      id: generateId<AgreementId>(),
      state: "Active",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    await seedAgreement(agreement);

    const response = await injectAppRequest(producerToken).post(
      `/agreements/${agreement.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when producer tries to reactivate an agreement suspended only by consumer", async () => {
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      suspendedByConsumerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(producerToken).post(
      `/agreements/${agreement.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it.each(notAllowedStates)(
    "returns 409 when the agreement is %s",
    async (state) => {
      const agreement: Agreement = {
        ...getMockAgreement(),
        id: generateId<AgreementId>(),
        producerId: TEST_ORGANIZATION_ID,
        state,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
      };
      await seedAgreement(agreement);

      const response = await injectAppRequest(producerToken).post(
        `/agreements/${agreement.id}/reactivateByProducer`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the agreement does not exist", async () => {
    const response = await injectAppRequest(producerToken).post(
      `/agreements/${generateId<AgreementId>()}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(404);
  });

  it("returns 403 when the caller is not the agreement's producer", async () => {
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      producerId: generateId<OrganizationId>(),
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(producerToken).post(
      `/agreements/${agreement.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(403);
  });

  it.each(forbiddenTestTokens(producerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const agreement = makeSuspendedAgreement({
        id: generateId<AgreementId>(),
        suspendedByProducerAt: new Date(),
      });
      await seedAgreement(agreement);

      const response = await injectAppRequest(spec).post(
        `/agreements/${agreement.id}/reactivateByProducer`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});

describe("POST /agreements/:agreementId/reactivateByConsumer", () => {
  it("reactivates an agreement suspended only by consumer -> Active", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00Z");
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      suspendedByConsumerAt: suspendedAt,
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Active");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: agreement.id,
      type: "AgreementReactivatedByConsumerV1",
      version: 1,
    });
  });

  it("reactivates one side of a fully-suspended agreement - stays Suspended", async () => {
    const suspendedByProducerAt = new Date("2026-01-01T00:00:00Z");
    const suspendedByConsumerAt = new Date("2026-01-02T00:00:00Z");
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      suspendedByConsumerAt,
      suspendedByProducerAt,
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBe(
      suspendedByProducerAt.toISOString(),
    );
  });

  it("returns 409 when consumer tries to reactivate an Active agreement", async () => {
    const agreement: Agreement = {
      ...getMockAgreement(),
      id: generateId<AgreementId>(),
      state: "Active",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when consumer tries to reactivate an agreement suspended only by producer", async () => {
    const agreement = makeSuspendedAgreement({
      id: generateId<AgreementId>(),
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken).post(
      `/agreements/${agreement.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it.each(notAllowedStates)(
    "returns 409 when the agreement is %s",
    async (state) => {
      const agreement: Agreement = {
        ...getMockAgreement(),
        id: generateId<AgreementId>(),
        state,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
      };
      await seedAgreement(agreement);

      const response = await injectAppRequest(internalToken).post(
        `/agreements/${agreement.id}/reactivateByConsumer`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the agreement does not exist", async () => {
    const response = await injectAppRequest(internalToken).post(
      `/agreements/${generateId<AgreementId>()}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(consumerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const agreement = makeSuspendedAgreement({
        id: generateId<AgreementId>(),
        suspendedByProducerAt: new Date(),
      });
      await seedAgreement(agreement);

      const response = await injectAppRequest(spec).post(
        `/agreements/${agreement.id}/reactivateByConsumer`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
