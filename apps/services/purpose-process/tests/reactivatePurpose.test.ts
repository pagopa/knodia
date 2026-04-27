import {
  generateId,
  type OrganizationId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { type Purpose, type PurposeState } from "@knodia/purpose-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockEservice, getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Purpose } from "../src/models/api.ts";

import {
  getAllPurposeEvents,
  injectAppRequest,
  seedEservice,
  seedPurpose,
} from "./utils.ts";

const internalToken: TestToken = { type: "internal" };
const producerToken: TestToken = {
  roles: ["administrative"],
  type: "ui-session",
};
const consumerAllowedTokens: TestToken[] = [internalToken];
const producerAllowedTokens: TestToken[] = [producerToken];

const notAllowedStates: PurposeState[] = ["Archived"];

function makeSuspendedPurpose(
  overrides: Partial<Purpose> & {
    suspendedByConsumerAt?: Date | null;
    suspendedByProducerAt?: Date | null;
  },
): Purpose {
  return {
    ...getMockPurpose(),
    state: "Suspended",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: null,
    ...overrides,
  };
}

async function seedOwnedPurpose(
  purpose: Purpose,
  producerId: OrganizationId = TEST_ORGANIZATION_ID,
): Promise<void> {
  const eservice = {
    ...getMockEservice({ latestVersionState: "Active" }),
    id: purpose.eserviceId,
    producerId,
  };
  await seedEservice(eservice);
  await seedPurpose(purpose);
}

describe("POST /purposes/:purposeId/reactivateByProducer", () => {
  it("reactivates a purpose suspended only by producer -> Active", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00Z");
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByProducerAt: suspendedAt,
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Active");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllPurposeEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: purpose.id,
      type: "PurposeReactivatedByProducerV1",
      version: 1,
    });
  });

  it("reactivates one side of a fully-suspended purpose - stays Suspended", async () => {
    const suspendedByProducerAt = new Date("2026-01-01T00:00:00Z");
    const suspendedByConsumerAt = new Date("2026-01-02T00:00:00Z");
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByConsumerAt,
      suspendedByProducerAt,
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByProducerAt).toBeNull();
    expect(body.suspendedByConsumerAt).toBe(
      suspendedByConsumerAt.toISOString(),
    );
  });

  it("returns 409 when producer tries to reactivate an Active purpose", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      id: generateId<PurposeId>(),
      state: "Active",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when producer tries to reactivate a purpose suspended only by consumer", async () => {
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByConsumerAt: new Date(),
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it.each(notAllowedStates)(
    "returns 409 when the purpose is %s",
    async (state) => {
      const purpose: Purpose = {
        ...getMockPurpose(),
        id: generateId<PurposeId>(),
        state,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
      };
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(producerToken).post(
        `/purposes/${purpose.id}/reactivateByProducer`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the purpose does not exist", async () => {
    const response = await injectAppRequest(producerToken).post(
      `/purposes/${generateId<PurposeId>()}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(404);
  });

  it("returns 403 when the caller is not the purpose's producer", async () => {
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByProducerAt: new Date(),
    });
    await seedOwnedPurpose(purpose, generateId<OrganizationId>());

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/reactivateByProducer`,
    );

    expect(response.statusCode).toBe(403);
  });

  it.each(forbiddenTestTokens(producerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const purpose = makeSuspendedPurpose({
        id: generateId<PurposeId>(),
        suspendedByProducerAt: new Date(),
      });
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(spec).post(
        `/purposes/${purpose.id}/reactivateByProducer`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});

describe("POST /purposes/:purposeId/reactivateByConsumer", () => {
  it("reactivates a purpose suspended only by consumer -> Active", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00Z");
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByConsumerAt: suspendedAt,
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Active");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllPurposeEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: purpose.id,
      type: "PurposeReactivatedByConsumerV1",
      version: 1,
    });
  });

  it("reactivates one side of a fully-suspended purpose - stays Suspended", async () => {
    const suspendedByProducerAt = new Date("2026-01-01T00:00:00Z");
    const suspendedByConsumerAt = new Date("2026-01-02T00:00:00Z");
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByConsumerAt,
      suspendedByProducerAt,
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBe(
      suspendedByProducerAt.toISOString(),
    );
  });

  it("returns 409 when consumer tries to reactivate an Active purpose", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      id: generateId<PurposeId>(),
      state: "Active",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when consumer tries to reactivate a purpose suspended only by producer", async () => {
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByProducerAt: new Date(),
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it.each(notAllowedStates)(
    "returns 409 when the purpose is %s",
    async (state) => {
      const purpose: Purpose = {
        ...getMockPurpose(),
        id: generateId<PurposeId>(),
        state,
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
      };
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(internalToken).post(
        `/purposes/${purpose.id}/reactivateByConsumer`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the purpose does not exist", async () => {
    const response = await injectAppRequest(internalToken).post(
      `/purposes/${generateId<PurposeId>()}/reactivateByConsumer`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(consumerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const purpose = makeSuspendedPurpose({
        id: generateId<PurposeId>(),
        suspendedByProducerAt: new Date(),
      });
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(spec).post(
        `/purposes/${purpose.id}/reactivateByConsumer`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
