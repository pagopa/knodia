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

function makePurpose(overrides: Partial<Purpose>): Purpose {
  return {
    ...getMockPurpose(),
    state: "Active",
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

describe("POST /purposes/:purposeId/suspendByProducer", () => {
  it("suspends an Active purpose", async () => {
    const purpose = makePurpose({ id: generateId<PurposeId>() });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/suspendByProducer`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByProducerAt).not.toBeNull();
    expect(body.suspendedByConsumerAt).toBeNull();

    const events = await getAllPurposeEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: purpose.id,
      type: "PurposeSuspendedByProducerV1",
      version: 1,
    });
  });

  it("suspends a purpose already suspended by consumer (escalates to both)", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00Z");
    const purpose = makePurpose({
      id: generateId<PurposeId>(),
      state: "Suspended",
      suspendedByConsumerAt: suspendedAt,
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/suspendByProducer`,
    );

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByConsumerAt).toBe(suspendedAt.toISOString());
    expect(body.suspendedByProducerAt).not.toBeNull();
  });

  it("returns 409 when producer tries to re-suspend their own suspension", async () => {
    const purpose = makePurpose({
      id: generateId<PurposeId>(),
      state: "Suspended",
      suspendedByProducerAt: new Date(),
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/suspendByProducer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it.each(notAllowedStates)(
    "returns 409 when the purpose is %s",
    async (state) => {
      const purpose = makePurpose({
        id: generateId<PurposeId>(),
        state,
      });
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(producerToken).post(
        `/purposes/${purpose.id}/suspendByProducer`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the purpose does not exist", async () => {
    const response = await injectAppRequest(producerToken).post(
      `/purposes/${generateId<PurposeId>()}/suspendByProducer`,
    );

    expect(response.statusCode).toBe(404);
  });

  it("returns 403 when the caller is not the purpose's producer", async () => {
    const purpose = makePurpose({ id: generateId<PurposeId>() });
    await seedOwnedPurpose(purpose, generateId<OrganizationId>());

    const response = await injectAppRequest(producerToken).post(
      `/purposes/${purpose.id}/suspendByProducer`,
    );

    expect(response.statusCode).toBe(403);
  });

  it.each(forbiddenTestTokens(producerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const purpose = makePurpose({ id: generateId<PurposeId>() });
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(spec).post(
        `/purposes/${purpose.id}/suspendByProducer`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});

describe("POST /purposes/:purposeId/suspendByConsumer", () => {
  it("suspends an Active purpose", async () => {
    const purpose = makePurpose({ id: generateId<PurposeId>() });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/suspendByConsumer`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByConsumerAt).not.toBeNull();
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllPurposeEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: purpose.id,
      type: "PurposeSuspendedByConsumerV1",
      version: 1,
    });
  });

  it("returns 409 when consumer tries to suspend a purpose already suspended by producer", async () => {
    const purpose = makePurpose({
      id: generateId<PurposeId>(),
      state: "Suspended",
      suspendedByProducerAt: new Date(),
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/suspendByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when consumer tries to suspend a purpose suspended by both", async () => {
    const purpose = makePurpose({
      id: generateId<PurposeId>(),
      state: "Suspended",
      suspendedByConsumerAt: new Date(),
      suspendedByProducerAt: new Date(),
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/suspendByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when consumer tries to re-suspend their own suspension", async () => {
    const purpose = makePurpose({
      id: generateId<PurposeId>(),
      state: "Suspended",
      suspendedByConsumerAt: new Date(),
    });
    await seedOwnedPurpose(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/suspendByConsumer`,
    );

    expect(response.statusCode).toBe(409);
  });

  it.each(notAllowedStates)(
    "returns 409 when the purpose is %s",
    async (state) => {
      const purpose = makePurpose({
        id: generateId<PurposeId>(),
        state,
      });
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(internalToken).post(
        `/purposes/${purpose.id}/suspendByConsumer`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the purpose does not exist", async () => {
    const response = await injectAppRequest(internalToken).post(
      `/purposes/${generateId<PurposeId>()}/suspendByConsumer`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(consumerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const purpose = makePurpose({ id: generateId<PurposeId>() });
      await seedOwnedPurpose(purpose);

      const response = await injectAppRequest(spec).post(
        `/purposes/${purpose.id}/suspendByConsumer`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
