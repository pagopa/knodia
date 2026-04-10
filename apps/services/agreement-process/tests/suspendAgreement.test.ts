import { type Agreement } from "@knodia/agreement-models";
import { type AgreementId, generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  API_Agreement,
  API_SuspendAgreementBody,
} from "../src/models/api.ts";

import {
  getAllAgreementEvents,
  injectAppRequest,
  seedAgreement,
} from "./utils.ts";

const internalToken: TestToken = { type: "internal" };
const allowedTestTokens: TestToken[] = [internalToken];

function makeAgreement(overrides: Partial<Agreement>): Agreement {
  return {
    ...getMockAgreement(),
    state: "Active",
    suspendedByConsumerAt: null,
    suspendedByProducerAt: null,
    ...overrides,
  };
}

describe("POST /agreements/:agreementId/suspend", () => {
  it("producer suspends an Active agreement", async () => {
    const agreement = makeAgreement({ id: generateId<AgreementId>() });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "producer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByProducerAt).not.toBeNull();
    expect(body.suspendedByConsumerAt).toBeNull();

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: agreement.id,
      type: "AgreementSuspendedByProducerV1",
      version: 1,
    });
  });

  it("consumer suspends an Active agreement", async () => {
    const agreement = makeAgreement({ id: generateId<AgreementId>() });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "consumer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByConsumerAt).not.toBeNull();
    expect(body.suspendedByProducerAt).toBeNull();

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      streamId: agreement.id,
      type: "AgreementSuspendedByConsumerV1",
      version: 1,
    });
  });

  it("producer suspends an agreement already suspended by consumer (escalates to both)", async () => {
    const suspendedAt = new Date("2026-01-01T00:00:00Z");
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      state: "Suspended",
      suspendedByConsumerAt: suspendedAt,
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "producer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(200);
    const body = response.json<API_Agreement>();
    expect(body.state).toBe("Suspended");
    expect(body.suspendedByConsumerAt).toBe(suspendedAt.toISOString());
    expect(body.suspendedByProducerAt).not.toBeNull();
  });

  it("returns 409 when consumer tries to suspend an agreement already suspended by producer", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      state: "Suspended",
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "consumer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when consumer tries to suspend an agreement suspended by both", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      state: "Suspended",
      suspendedByConsumerAt: new Date(),
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "consumer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when producer tries to re-suspend their own suspension", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      state: "Suspended",
      suspendedByProducerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "producer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when consumer tries to re-suspend their own suspension", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      state: "Suspended",
      suspendedByConsumerAt: new Date(),
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "consumer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(409);
  });

  it("returns 409 when the agreement is Archived", async () => {
    const agreement = makeAgreement({
      id: generateId<AgreementId>(),
      state: "Archived",
    });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body({ suspendedBy: "producer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(409);
  });

  it("returns 404 when the agreement does not exist", async () => {
    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${generateId<AgreementId>()}/suspend`)
      .body({ suspendedBy: "producer" } satisfies API_SuspendAgreementBody);

    expect(response.statusCode).toBe(404);
  });

  it.each([
    ["empty body", {}],
    ["invalid suspendedBy", { suspendedBy: "other" }],
    ["extra property", { extra: true, suspendedBy: "producer" }],
  ])("returns 400 on malformed body (%s)", async (_label, body) => {
    const agreement = makeAgreement({ id: generateId<AgreementId>() });
    await seedAgreement(agreement);

    const response = await injectAppRequest(internalToken)
      .post(`/agreements/${agreement.id}/suspend`)
      .body(body as never);

    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "returns 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const agreement = makeAgreement({ id: generateId<AgreementId>() });
      await seedAgreement(agreement);

      const response = await injectAppRequest(spec)
        .post(`/agreements/${agreement.id}/suspend`)
        .body({ suspendedBy: "producer" } satisfies API_SuspendAgreementBody);

      expect(response.statusCode).toBe(403);
    },
  );
});
