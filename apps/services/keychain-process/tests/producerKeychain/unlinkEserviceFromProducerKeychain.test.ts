/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type EserviceId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";
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
import { getMockProducerKeychain } from "@knodia/test-commons/utils";
import { assert, beforeEach, describe, expect, it } from "vitest";

import {
  getAllKeychainEvents,
  injectAppRequest,
  seedProducerKeychain,
  seedProducerKeychainEservice,
} from "../utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("DELETE /producerKeychains/:producerKeychainId/eservices/:eserviceId (unlinkEserviceFromProducerKeychain)", () => {
  const producerKeychain: ProducerKeychain = {
    ...getMockProducerKeychain(),
    ownerId: TEST_ORGANIZATION_ID,
  };
  const eserviceId = generateId<EserviceId>();
  const producerKeychainEservice: ProducerKeychainEservice = {
    eserviceId,
    linkedAt: new Date(),
    producerKeychainId: producerKeychain.id,
  };

  beforeEach(async () => {
    await seedProducerKeychain(producerKeychain);
    await seedProducerKeychainEservice(
      producerKeychain,
      producerKeychainEservice,
    );
  });

  it("should correctly create producer keychain eservice unlink event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/producerKeychains/${producerKeychain.id}/eservices/${eserviceId}`,
    );

    expect(response.statusCode).toBe(204);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("2");

    const events = await getAllKeychainEvents();
    const unlinkEvent = events[2];

    expect(unlinkEvent).toMatchObject({
      streamId: producerKeychain.id,
      type: "ProducerKeychainEserviceUnlinkedV1",
      version: 2,
    });

    const parsedEvent = KeychainEventV1.parse(unlinkEvent);
    assert(parsedEvent.type === "ProducerKeychainEserviceUnlinkedV1");

    expect(parsedEvent.data).toMatchObject({
      eserviceId,
      producerKeychain: expect.objectContaining({ id: producerKeychain.id }),
    });
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec).delete(
        `/producerKeychains/${producerKeychain.id}/eservices/${eserviceId}`,
      );
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 if the producer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/producerKeychains/${generateId()}/eservices/${eserviceId}`,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the eservice is not linked to the producer keychain", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/producerKeychains/${producerKeychain.id}/eservices/${generateId()}`,
    );
    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the requester is not the producer keychain owner", async () => {
    const response = await injectAppRequest({
      organizationId: generateId<OrganizationId>(),
      roles: ["administrative"],
      type: "ui-session",
    }).delete(
      `/producerKeychains/${producerKeychain.id}/eservices/${eserviceId}`,
    );
    expect(response.statusCode).toBe(403);
  });

  it("should return 400 for invalid eservice id format", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).delete(
      `/producerKeychains/${producerKeychain.id}/eservices/not-a-uuid`,
    );
    expect(response.statusCode).toBe(400);
  });
});
