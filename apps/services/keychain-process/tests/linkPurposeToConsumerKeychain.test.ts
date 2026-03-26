/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  type ConsumerKeychainPurpose,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { type PurposeV1, toPurposeV1 } from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockConsumerKeychain,
  getMockPurpose,
} from "@knodia/test-commons/utils";
import { assert, beforeAll, describe, expect, it } from "vitest";

import {
  type API_ConsumerKeychainPurpose,
  type API_ConsumerKeychainPurposeLinkSeed,
} from "../src/models/api.ts";
import { toAPI_ConsumerKeychainPurpose } from "../src/models/apiConverter.ts";
import { purposeWriterService } from "./setup.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /consumerKeychains/:consumerKeychainId/purposes (linkPurposeToConsumerKeychain)", () => {
  const consumerKeychain = getMockConsumerKeychain();
  const purpose = getMockPurpose();
  const body: API_ConsumerKeychainPurposeLinkSeed = {
    purposeId: purpose.id,
  };

  beforeAll(async () => {
    await Promise.all([
      seedConsumerKeychain(consumerKeychain),
      purposeWriterService.upsertPurpose(purpose, 0),
    ]);
  });

  it("should correctly create consumer keychain purpose link event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post(`/consumerKeychains/${consumerKeychain.id}/purposes`)
      .body(body);

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const responseBody = response.json<API_ConsumerKeychainPurpose>();

    const expectedConsumerKeychainPurpose: ConsumerKeychainPurpose = {
      consumerKeychainId: consumerKeychain.id,
      linkedAt: new Date(responseBody.linkedAt),
      purposeId: purpose.id,
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
    const expectedPurpose = toPurposeV1(purpose);

    expect(linkEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(consumerKeychain),
      linkedAt: new Date(responseBody.linkedAt).getTime(),
      purpose: {
        ...expectedPurpose,
        formAnswersJson: expect.any(String),
      } satisfies PurposeV1,
    });
    expect(JSON.parse(linkEventData.purpose!.formAnswersJson!)).toEqual(
      JSON.parse(expectedPurpose.formAnswersJson!),
    );
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
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
        purposeId: generateId(),
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
