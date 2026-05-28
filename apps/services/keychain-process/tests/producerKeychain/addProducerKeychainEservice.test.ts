/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  KeychainEventV1,
  type ProducerKeychain,
  type ProducerKeychainEservice,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockEservice,
  getMockProducerKeychain,
} from "@knodia/test-commons/utils";
import { assert, beforeEach, describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedEservice,
  seedProducerKeychain,
  seedProducerKeychainEservice,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /producerKeychains/:producerKeychainId/eservices (linkEserviceToProducerKeychain)", () => {
  const producerKeychain: ProducerKeychain = {
    ...getMockProducerKeychain(),
    ownerId: TEST_ORGANIZATION_ID,
  };
  const eservice = {
    ...getMockEservice(),
    producerId: TEST_ORGANIZATION_ID,
  };
  const eserviceId = eservice.id;
  const body = { eserviceId };

  beforeEach(async () => {
    await Promise.all([
      seedProducerKeychain(producerKeychain),
      seedEservice(eservice),
    ]);
  });

  it("should correctly create producer keychain eservice link event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/producerKeychains/${producerKeychain.id}/eservices`)
      .body(body);

    expect(response.statusCode).toBe(204);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const events = await getAllKeychainEvents();
    const linkEvent = events[1];

    expect(linkEvent).toMatchObject({
      streamId: producerKeychain.id,
      type: "ProducerKeychainEserviceLinkedV1",
      version: 1,
    });

    const parsedEvent = KeychainEventV1.parse(linkEvent);
    assert(parsedEvent.type === "ProducerKeychainEserviceLinkedV1");

    expect(parsedEvent.data).toMatchObject({
      eserviceId,
      linkedAt: expect.any(Number),
      producerKeychain: expect.objectContaining({ id: producerKeychain.id }),
    });
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["eserviceId is invalid", { eserviceId: "not-a-valid-uuid" }],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, requestBody) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post(`/producerKeychains/${producerKeychain.id}/eservices`)
        .body(requestBody as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post(`/producerKeychains/${producerKeychain.id}/eservices`)
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/producerKeychains/${generateId()}/eservices`)
      .body(body);
    expect(response.statusCode).toBe(404);
  });

  it("should return 409 if the eservice is already linked to the producer keychain", async () => {
    const producerKeychainEservice: ProducerKeychainEservice = {
      eserviceId,
      linkedAt: new Date(),
      producerKeychainId: producerKeychain.id,
    };
    await seedProducerKeychainEservice(
      producerKeychain,
      producerKeychainEservice,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/producerKeychains/${producerKeychain.id}/eservices`)
      .body(body);
    expect(response.statusCode).toBe(409);
  });

  it("should return 403 if the requester is not the producer keychain owner", async () => {
    const response = await injectAppRequest({
      organizationId: generateId<OrganizationId>(),
      roles: ["administrative"],
      type: "ui-session",
    })
      .post(`/producerKeychains/${producerKeychain.id}/eservices`)
      .body(body);
    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the eservice does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/producerKeychains/${producerKeychain.id}/eservices`)
      .body({ eserviceId: generateId() });
    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the requester is not the eservice producer", async () => {
    const foreignEservice = {
      ...getMockEservice({ seed: 1 }),
      producerId: generateId<OrganizationId>(),
    };
    await seedEservice(foreignEservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/producerKeychains/${producerKeychain.id}/eservices`)
      .body({ eserviceId: foreignEservice.id });
    expect(response.statusCode).toBe(403);
  });

  it("should return 400 for invalid producer keychain id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/producerKeychains/not-a-uuid/eservices`)
      .body(body);
    expect(response.statusCode).toBe(400);
  });
});
