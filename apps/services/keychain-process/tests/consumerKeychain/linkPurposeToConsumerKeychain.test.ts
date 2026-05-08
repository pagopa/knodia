/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { API_ConsumerKeychainPurposeLinkSeed } from "@knodia/keychain-models/api";
import type { Purpose } from "@knodia/purpose-models";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import {
  type ExternalResource,
  generateExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import {
  generateId,
  type KnodeId,
  type OrganizationId,
  type PurposeId,
} from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockPurpose,
} from "@knodia/test-commons/utils";
import { AxiosError, type AxiosResponse } from "axios";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import { consumerKeychainWriterService } from "../setup.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
  toRRM_Purpose,
} from "../utils.ts";

const getPurposeMock = vi.hoisted(() => vi.fn());

vi.mock("@knodia/remote-resources-manager-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/remote-resources-manager-client")
    >();

  return {
    ...original,
    remoteResourcesManagerApi: {
      ...original.remoteResourcesManagerApi,
      getPurpose: getPurposeMock,
    },
  };
});

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /consumerKeychains/:consumerKeychainId/purposes (linkPurposeToConsumerKeychain)", () => {
  const knodeId: KnodeId = "Orion";
  const consumerKeychain: ConsumerKeychain = {
    ...getMockConsumerKeychain(),
    ownerId: TEST_ORGANIZATION_ID,
  };
  const purpose: Purpose = {
    ...getMockPurpose(),
    consumer: {
      id: unsafeBrandExternalId(TEST_ORGANIZATION_ID),
      knodeId,
    },
  };
  const externalPurpose: ExternalResource<PurposeId> = {
    id: unsafeBrandExternalId(purpose.id),
    knodeId,
  };
  const apiPurpose = toRRM_Purpose(purpose, knodeId);
  const body: API_ConsumerKeychainPurposeLinkSeed = {
    knodeId,
    purposeId: purpose.id,
  };

  beforeEach(async () => {
    await seedConsumerKeychain(consumerKeychain);
    getPurposeMock.mockReset();
  });

  it("should correctly create consumer keychain purpose link event", async () => {
    getPurposeMock.mockResolvedValue({ data: apiPurpose });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body(body);

    expect(response.statusCode).toBe(204);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const events = await getAllKeychainEvents();
    const linkEvent = events[1];

    expect(linkEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainPurposeLinkedV1",
      version: 1,
    });

    const parsedEvent = KeychainEventV1.parse(linkEvent);
    assert(parsedEvent.type === "ConsumerKeychainPurposeLinkedV1");

    const linkEventData = parsedEvent.data;

    expect(linkEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      linkedAt: expect.any(Number),
      purpose: externalPurpose,
    });
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["invalid knode id", { ...body, knodeId: "InvalidKnodeId" }],
    ["purposeId is invalid", { purposeId: "not-a-valid-uuid" }],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, requestBody) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
        .body(requestBody as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 404 if the purpose does not exist", async () => {
    const getPurposeMockMessage = "Purpose Not Found";
    getPurposeMock.mockRejectedValue(
      new AxiosError(getPurposeMockMessage, "404", undefined, undefined, {
        data: {
          correlationId: generateId(),
          status: 404,
          title: getPurposeMockMessage,
        },
      } as AxiosResponse),
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body({
        ...body,
        purposeId: generateExternalId(),
      } satisfies API_ConsumerKeychainPurposeLinkSeed);
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${generateId()}/purposes`)
      .body(body);
    expect(response.statusCode).toBe(404);
  });

  it("should return 409 if the purpose is already linked to the consumer keychain", async () => {
    const consumerKeychainPurpose: ConsumerKeychainPurpose = {
      consumerKeychainId: consumerKeychain.id,
      linkedAt: new Date(),
      purpose: externalPurpose,
    };
    await consumerKeychainWriterService.upsertConsumerKeychainPurpose(
      consumerKeychainPurpose,
      1,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body(body);
    expect(response.statusCode).toBe(409);
  });

  it("should return 403 if the requester is not the consumer keychain owner", async () => {
    getPurposeMock.mockResolvedValue({ data: apiPurpose });

    const response = await injectAppRequest({
      organizationId: generateId<OrganizationId>(),
      roles: ["administrative"],
      type: "ui-session",
    })
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body(body);
    expect(response.statusCode).toBe(403);
  });

  it("should return 403 if the requester is not the purpose consumer", async () => {
    getPurposeMock.mockResolvedValue({
      data: {
        ...apiPurpose,
        consumer: {
          id: generateExternalId(),
          knodeId,
        },
      } satisfies remoteResourcesManagerApi.Purpose,
    });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body(body);
    expect(response.statusCode).toBe(403);
  });
});
