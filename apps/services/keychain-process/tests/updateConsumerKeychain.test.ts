/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { generateId, OrganizationId } from "@knodia/common-models/ids";
import {
  ConsumerKeychain,
  KeychainEventV1,
  toConsumerKeychainV1,
} from "@knodia/keychain-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockConsumerKeychain } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type {
  API_ConsumerKeychainPatch,
  API_Keychain,
} from "../src/models/api.ts";

import { toAPI_Keychain } from "../src/models/apiConverter.ts";
import {
  getAllKeychainEvents,
  injectAppRequest,
  seedConsumerKeychain,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

const consumerKeychain = getMockConsumerKeychain();

describe("PATCH /consumerKeychains/:consumerKeychainId (ConsumerKeychainPatch)", () => {
  it("should correctly create consumer keychain update event", async () => {
    await seedConsumerKeychain(consumerKeychain);

    const body: API_ConsumerKeychainPatch = {
      description: null,
      name: { en: "Updated Consumer keychain name" },
    };

    const response = await injectAppRequest({
      ...allowedTestTokens[0]!,
      organizationId: consumerKeychain.ownerId,
      type: "ui-session",
    })
      .patch(`/consumerKeychains/${consumerKeychain.id}`)
      .body(body);

    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_Keychain>();
    const expectedConsumerKeychain: ConsumerKeychain = {
      ...consumerKeychain,
      description: undefined,
      name: body.name!,
      updatedAt: new Date(responseBody.updatedAt),
    };

    expect(responseBody).toMatchObject(
      toAPI_Keychain(expectedConsumerKeychain),
    );

    const events = await getAllKeychainEvents();
    expect(events).toHaveLength(2);

    const updatedEvent = events[1];

    expect(updatedEvent).toMatchObject({
      streamId: consumerKeychain.id,
      type: "ConsumerKeychainUpdatedV1",
      version: 1,
    });

    const updatedEventData = KeychainEventV1.parse(updatedEvent).data;
    expect(updatedEventData).toMatchObject({
      consumerKeychain: toConsumerKeychainV1(expectedConsumerKeychain),
    });
  });

  it.each([
    ["invalid property", { invalidProperty: "invalid" }],
    ["name is empty", { name: {} }],
    ["description is too short", { description: { en: "short" } }],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      await seedConsumerKeychain(consumerKeychain);

      const response = await injectAppRequest({
        ...allowedTestTokens[0]!,
        organizationId: consumerKeychain.ownerId,
        type: "ui-session",
      })
        .patch(`/consumerKeychains/${consumerKeychain.id}`)
        .body(body as never);

      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 403 if the organization is not the owner of the consumer keychain", async () => {
    const consumerKeychain: ConsumerKeychain = {
      ...getMockConsumerKeychain(1),
      ownerId: generateId<OrganizationId>(),
    };

    await seedConsumerKeychain(consumerKeychain);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/consumerKeychains/${consumerKeychain.id}`)
      .body({ name: { en: "Updated Consumer keychain name" } });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if the consumer keychain does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/consumerKeychains/${generateId()}`)
      .body({ name: { en: "Updated Consumer keychain name" } });

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .patch(`/consumerKeychains/${consumerKeychain.id}`)
        .body({ name: { en: "Updated Consumer keychain name" } });

      expect(response.statusCode).toBe(403);
    },
  );
});
