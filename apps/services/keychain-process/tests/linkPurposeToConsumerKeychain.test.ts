/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Purpose } from "@knodia/purpose-models";
import type { remoteResourcesManagerApi } from "@knodia/remote-resources-manager-client";

import {
  generateExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";
import { generateId, type KnodeId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychain,
  type ConsumerKeychainPurpose,
  KeychainEventV1,
  toConsumerKeychainLinkedPurposeV1,
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
import {
  assert,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  type API_ConsumerKeychainPurpose,
  type API_ConsumerKeychainPurposeLinkSeed,
} from "../src/models/api.ts";
import { toAPI_ConsumerKeychainPurpose } from "../src/models/apiConverter.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
} from "./utils.ts";

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
  const apiPurpose: remoteResourcesManagerApi.Purpose = {
    consumer: purpose.consumer,
    dailyCalls: purpose.dailyCalls,
    description: purpose.description,
    eserviceId: purpose.eserviceId,
    id: purpose.id,
    name: purpose.name,
    state: purpose.state,
    updatedAt: purpose.updatedAt.toISOString(),
  };
  const body: API_ConsumerKeychainPurposeLinkSeed = {
    knodeId,
    purposeId: purpose.id,
  };

  beforeAll(async () => {
    await Promise.all([seedConsumerKeychain(consumerKeychain)]);
  });

  beforeEach(() => {
    getPurposeMock.mockReset();
  });

  it("should correctly create consumer keychain purpose link event", async () => {
    getPurposeMock.mockResolvedValue({ data: apiPurpose });

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body(body);

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const responseBody = response.json<API_ConsumerKeychainPurpose>();

    const expectedConsumerKeychainPurpose: ConsumerKeychainPurpose = {
      consumerKeychainId: consumerKeychain.id,
      linkedAt: new Date(responseBody.linkedAt),
      purpose: { id: unsafeBrandExternalId(purpose.id), knodeId },
    };

    expect(responseBody).toMatchObject(
      toAPI_ConsumerKeychainPurpose(expectedConsumerKeychainPurpose),
    );

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
      linkedAt: new Date(responseBody.linkedAt).getTime(),
      purpose: toConsumerKeychainLinkedPurposeV1({
        id: unsafeBrandExternalId(purpose.id),
        knodeId,
      }),
    });
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["invalid property", { ...body, knodeId: "InvalidKnodeId" }],
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
});
