/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateExternalId } from "@knodia/common-models/externalResource";
import { generateId, KnodeId, type OrganizationId } from "@knodia/common-models/ids";
import { PurposeEventV1, toPurposeV1 } from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_Purpose } from "../src/models/api.ts";

import { API_PurposeSeed } from "../src/models/api.ts";
import { getAllPurposeEvents, injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const consumerId = generateExternalId<OrganizationId>();

const body: API_PurposeSeed = {
  consumer: {
    id: consumerId,
    knodeId: "Orion",
  },
  dailyCalls: 1000,
  description: { en: "A test purpose description" },
  eserviceId: generateId(),
  formAnswers: { question1: "answer1" },
  name: { en: "Test Purpose" },
};

describe("POST /purposes (createPurpose)", () => {
  it.each(allowedTestTokens)(
    "should correctly create purpose and write event ($type, $roles)",
    async (token) => {
      const response = await injectAppRequest(token)
        .post("/purposes")
        .body(body);
      expect(response.statusCode).toBe(201);

      const responseBody = response.json<API_Purpose>();

      expect(responseBody).toMatchObject({
        consumer: {
          id: consumerId,
          knodeId: "Orion",
        },
        dailyCalls: body.dailyCalls,
        description: body.description,
        eserviceId: body.eserviceId,
        name: body.name,
        state: "Active",
      });
      expect(responseBody.id).toBeDefined();
      expect(responseBody.createdAt).toBeDefined();
      expect(responseBody.updatedAt).toBeDefined();

      const events = await getAllPurposeEvents();
      expect(events).toHaveLength(1);

      const createdEvent = events[0];

      expect(createdEvent).toMatchObject({
        streamId: responseBody.id,
        type: "PurposeActivatedV1",
        version: 0,
      });

      const createdEventData = PurposeEventV1.parse(createdEvent).data;
      expect(createdEventData.purpose).toMatchObject(
        toPurposeV1({
          consumer: {
            id: consumerId,
            knodeId: KnodeId.parse("Orion"),
          },
          createdAt: new Date(responseBody.createdAt),
          dailyCalls: body.dailyCalls,
          description: body.description,
          eserviceId: expect.any(String),
          formAnswers: body.formAnswers,
          id: responseBody.id,
          name: body.name,
          state: "Active",
          updatedAt: new Date(responseBody.updatedAt),
        }),
      );
    },
  );

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["eserviceId is not a uuid", { ...body, eserviceId: 99 }],
    ["eserviceId is empty", { ...body, eserviceId: "" }],
    ["name is too short", { ...body, name: { en: "ab" } }],
    ["description is too short", { ...body, description: { en: "short" } }],
    ["dailyCalls is negative", { ...body, dailyCalls: -1 }],
    [
      "consumerKnodeId is unknown",
      { ...body, consumer: { ...body.consumer, knodeId: "UnknownKnodeId" } },
    ],
    [
      "consumerId is not a uuid",
      { ...body, consumer: { ...body.consumer, id: 99 } },
    ],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body(body as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (token) => {
      const response = await injectAppRequest(token)
        .post("/purposes")
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );
});
