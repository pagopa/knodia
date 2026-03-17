/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Purpose } from "@knodia/purpose-models";

import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { fromPurposeV1, PurposeEventV1 } from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement, getMockEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Purpose } from "../src/models/api.ts";

import { API_PurposeSeed } from "../src/models/api.ts";
import { agreementWriterService, eserviceWriterService } from "./setup.ts";
import {
  getAllPurposeEvents,
  injectAppRequest,
  toExpectAPI_Purpose,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const eservice = getMockEservice({ latestVersionState: "Active" });
const consumerId = generateExternalId<OrganizationId>();
const consumerKnodeId = KnodeId.parse("Orion");

const body: API_PurposeSeed = {
  consumer: {
    id: consumerId,
    knodeId: consumerKnodeId,
  },
  dailyCalls: 1000,
  description: { en: "A test purpose description" },
  eserviceId: eservice.id,
  formAnswersJson: { question1: "answer1" },
  name: { en: "Test Purpose" },
};

const setupEserviceAndAgreement = async () => {
  await eserviceWriterService.upsertEservice(eservice, 1);
  await agreementWriterService.upsertAgreement(
    {
      ...getMockAgreement(),
      consumer: { id: consumerId, knodeId: consumerKnodeId },
      eserviceId: eservice.id,
      eserviceVersionId: eservice.versions[0]!.id,
      producerId: eservice.producerId,
      state: "Active",
    },
    1,
  );
};

describe("POST /purposes (createPurpose)", () => {
  it.each(allowedTestTokens)(
    "should correctly create purpose and write event ($type)",
    async (token) => {
      await setupEserviceAndAgreement();

      const response = await injectAppRequest(token)
        .post("/purposes")
        .body(body);
      expect(response.statusCode).toBe(201);

      const responseBody = response.json<API_Purpose>();

      const expectedPurpose: Purpose = {
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        createdAt: new Date(responseBody.createdAt),
        dailyCalls: body.dailyCalls,
        description: body.description,
        eserviceId: eservice.id,
        formAnswersJson: body.formAnswersJson,
        id: expect.any(String),
        name: body.name,
        state: "Active",
        updatedAt: new Date(responseBody.updatedAt),
      };

      expect(responseBody).toMatchObject(toExpectAPI_Purpose(expectedPurpose));

      const events = await getAllPurposeEvents();
      expect(events).toHaveLength(1);

      const createdEvent = events[0];

      expect(createdEvent).toMatchObject({
        streamId: responseBody.id,
        type: "PurposeActivatedV1",
        version: 0,
      });

      const createdEventData = PurposeEventV1.parse(createdEvent).data;
      const createdPurpose = fromPurposeV1(createdEventData.purpose!);
      expect(createdPurpose).toMatchObject(expectedPurpose);
    },
  );

  it("should return 409 if the e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        eserviceId: generateId(),
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if the e-service version is not active", async () => {
    const archivedEservice = getMockEservice({
      latestVersionState: "Archived",
      seed: 10,
    });
    await eserviceWriterService.upsertEservice(archivedEservice, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        eserviceId: archivedEservice.id,
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if no agreement exists for the consumer/eservice pair", async () => {
    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        consumer: {
          id: generateExternalId<OrganizationId>(),
          knodeId: consumerKnodeId,
        },
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if the agreement exists but is not active", async () => {
    const otherEservice = getMockEservice({
      latestVersionState: "Active",
      seed: 20,
    });
    const otherConsumerId = generateExternalId<OrganizationId>();
    await eserviceWriterService.upsertEservice(otherEservice, 1);
    await agreementWriterService.upsertAgreement(
      {
        ...getMockAgreement(20),
        consumer: { id: otherConsumerId, knodeId: consumerKnodeId },
        eserviceId: otherEservice.id,
        eserviceVersionId: otherEservice.versions[0]!.id,
        producerId: otherEservice.producerId,
        state: "Archived",
      },
      1,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        consumer: { id: otherConsumerId, knodeId: consumerKnodeId },
        eserviceId: otherEservice.id,
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(409);
  });

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
