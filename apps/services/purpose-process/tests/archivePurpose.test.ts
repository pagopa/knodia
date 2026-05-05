import { generateId, type PurposeId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { type Purpose, PurposeState } from "@knodia/purpose-models";
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
const allowedTokens: TestToken[] = [internalToken];

const allowedStates: PurposeState[] = ["Suspended"];
const notAllowedStates: PurposeState[] = PurposeState.options.filter(
  (s) => !allowedStates.includes(s),
);

const consumerSuspendedAt = new Date("2026-01-15T10:00:00Z");
const producerSuspendedAt = new Date("2026-01-20T12:00:00Z");

const happyPathCases = [
  {
    name: "suspended by the consumer",
    suspendedByConsumerAt: consumerSuspendedAt,
    suspendedByProducerAt: null,
  },
  {
    name: "suspended by the producer",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: producerSuspendedAt,
  },
  {
    name: "suspended by both parties",
    suspendedByConsumerAt: consumerSuspendedAt,
    suspendedByProducerAt: producerSuspendedAt,
  },
];

function makeSuspendedPurpose(overrides: Partial<Purpose>): Purpose {
  return {
    ...getMockPurpose(),
    state: "Suspended",
    suspendedByConsumerAt: consumerSuspendedAt,
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
  it.each(happyPathCases)(
    "archives a purpose $name",
    async ({ suspendedByConsumerAt, suspendedByProducerAt }) => {
      const purpose = makeSuspendedPurpose({
        id: generateId<PurposeId>(),
        suspendedByConsumerAt,
        suspendedByProducerAt,
      });
      await seedPurposeWithEservice(purpose);

      const response = await injectAppRequest(internalToken).post(
        `/purposes/${purpose.id}/archive`,
      );

      expect(response.statusCode).toBe(200);
      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

      const body = response.json<API_Purpose>();
      expect(body.state).toBe("Archived");
      expect(body.suspendedByConsumerAt).toBe(
        suspendedByConsumerAt?.toISOString() ?? null,
      );
      expect(body.suspendedByProducerAt).toBe(
        suspendedByProducerAt?.toISOString() ?? null,
      );

      const events = await getAllPurposeEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toMatchObject({
        streamId: purpose.id,
        type: "PurposeArchivedV1",
        version: 1,
      });
    },
  );

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

  it.each(forbiddenTestTokens(allowedTokens))(
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
