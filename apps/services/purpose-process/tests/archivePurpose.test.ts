import { generateId, type PurposeId } from "@knodia/common-models/ids";
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
const consumerAllowedTokens: TestToken[] = [internalToken];

const notAllowedStates: PurposeState[] = ["Active", "Archived"];

function makeSuspendedPurpose(overrides: Partial<Purpose>): Purpose {
  return {
    ...getMockPurpose(),
    state: "Suspended",
    suspendedByConsumerAt: new Date("2026-01-15T10:00:00Z"),
    suspendedByProducerAt: null,
    ...overrides,
  };
}

async function seedPurposeWithEservice(purpose: Purpose): Promise<void> {
  const eservice = {
    ...getMockEservice({ latestVersionState: "Active" }),
    id: purpose.eserviceId,
    producerId: TEST_ORGANIZATION_ID,
  };
  await seedEservice(eservice);
  await seedPurpose(purpose);
}

describe("POST /purposes/:purposeId/archive", () => {
  it("archives a purpose suspended by the consumer", async () => {
    const purpose = makeSuspendedPurpose({ id: generateId<PurposeId>() });
    await seedPurposeWithEservice(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/archive`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Archived");
    expect(body.suspendedByConsumerAt).toBe(
      purpose.suspendedByConsumerAt?.toISOString(),
    );
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllPurposeEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: purpose.id,
      type: "PurposeArchivedV1",
      version: 1,
    });
  });

  it("archives a purpose suspended by the producer", async () => {
    const producerSuspendedAt = new Date("2026-01-20T12:00:00Z");
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByConsumerAt: null,
      suspendedByProducerAt: producerSuspendedAt,
    });
    await seedPurposeWithEservice(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/archive`,
    );

    expect(response.statusCode).toBe(200);

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Archived");
    expect(body.suspendedByConsumerAt).toBeNull();
    expect(body.suspendedByProducerAt).toBe(producerSuspendedAt.toISOString());
  });

  it("archives a purpose suspended by both parties", async () => {
    const consumerSuspendedAt = new Date("2026-01-15T10:00:00Z");
    const producerSuspendedAt = new Date("2026-01-20T12:00:00Z");
    const purpose = makeSuspendedPurpose({
      id: generateId<PurposeId>(),
      suspendedByConsumerAt: consumerSuspendedAt,
      suspendedByProducerAt: producerSuspendedAt,
    });
    await seedPurposeWithEservice(purpose);

    const response = await injectAppRequest(internalToken).post(
      `/purposes/${purpose.id}/archive`,
    );

    expect(response.statusCode).toBe(200);

    const body = response.json<API_Purpose>();
    expect(body.state).toBe("Archived");
    expect(body.suspendedByConsumerAt).toBe(consumerSuspendedAt.toISOString());
    expect(body.suspendedByProducerAt).toBe(producerSuspendedAt.toISOString());
  });

  it.each(notAllowedStates)(
    "returns 409 when the purpose is %s",
    async (state) => {
      const purpose = makeSuspendedPurpose({
        id: generateId<PurposeId>(),
        state,
        suspendedByConsumerAt: null,
      });
      await seedPurposeWithEservice(purpose);

      const response = await injectAppRequest(internalToken).post(
        `/purposes/${purpose.id}/archive`,
      );

      expect(response.statusCode).toBe(409);
    },
  );

  it("returns 404 when the purpose does not exist", async () => {
    const response = await injectAppRequest(internalToken).post(
      `/purposes/${generateId<PurposeId>()}/archive`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(consumerAllowedTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const purpose = makeSuspendedPurpose({ id: generateId<PurposeId>() });
      await seedPurposeWithEservice(purpose);

      const response = await injectAppRequest(spec).post(
        `/purposes/${purpose.id}/archive`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
