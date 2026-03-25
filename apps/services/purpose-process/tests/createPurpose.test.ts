/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AgreementState } from "@knodia/agreement-models";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import { EserviceMode, EserviceVersionState } from "@knodia/eservice-models";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  fromPurposeV1,
  type Purpose,
  PurposeEventV1,
  PurposeFormSchemaVersion,
} from "@knodia/purpose-models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockAgreement,
  getMockEservice,
  MOCK_PURPOSE_FORM_ANSWERS,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Purpose, API_PurposeSeed } from "../src/models/api.ts";

import { agreementWriterService, eserviceWriterService } from "./setup.ts";
import {
  getAllPurposeEvents,
  injectAppRequest,
  toExpectAPI_Purpose,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const eservice = {
  ...getMockEservice({ latestVersionState: "Active" }),
  mode: "ProvideData" as const,
};
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
  formAnswersJson: MOCK_PURPOSE_FORM_ANSWERS,
  formSchemaVersion: PurposeFormSchemaVersion.enum["1.0"],
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
      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");

      const responseBody = response.json<API_Purpose>();

      const expectedPurpose: Purpose = {
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        createdAt: new Date(responseBody.createdAt),
        dailyCalls: body.dailyCalls,
        description: body.description,
        eserviceId: eservice.id,
        formAnswersJson: body.formAnswersJson,
        formSchemaVersion: PurposeFormSchemaVersion.enum["1.0"],
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

  const notAllowedEserviceModes = EserviceMode.options.filter(
    (m) => m !== "ProvideData",
  );

  it.each(notAllowedEserviceModes)(
    "should return 409 if the e-service mode is %s",
    async (mode) => {
      const testEservice = {
        ...getMockEservice({
          latestVersionState: "Active",
          seed: notAllowedEserviceModes.indexOf(mode) + 60,
        }),
        mode,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);
      await agreementWriterService.upsertAgreement(
        {
          ...getMockAgreement({
            seed: notAllowedEserviceModes.indexOf(mode) + 60,
          }),
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          eserviceId: testEservice.id,
          eserviceVersionId: testEservice.versions[0]!.id,
          producerId: testEservice.producerId,
          state: "Active",
        },
        1,
      );

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body({
          ...body,
          eserviceId: testEservice.id,
        } satisfies API_PurposeSeed);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 404 if the e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        eserviceId: generateId(),
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(404);
  });

  const allowedEserviceVersionStates: EserviceVersionState[] = [
    "Active",
    "Suspended",
  ];
  const notAllowedEserviceVersionStates = EserviceVersionState.options.filter(
    (s) => !allowedEserviceVersionStates.includes(s),
  );

  it.each(allowedEserviceVersionStates)(
    "should succeed if the e-service version is %s",
    async (state) => {
      const testEservice = {
        ...getMockEservice({
          latestVersionState: state,
          seed: allowedEserviceVersionStates.indexOf(state) + 10,
        }),
        mode: "ProvideData" as const,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);
      await agreementWriterService.upsertAgreement(
        {
          ...getMockAgreement({
            seed: allowedEserviceVersionStates.indexOf(state) + 10,
          }),
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          eserviceId: testEservice.id,
          eserviceVersionId: testEservice.versions[0]!.id,
          producerId: testEservice.producerId,
          state: "Active",
        },
        1,
      );

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body({
          ...body,
          eserviceId: testEservice.id,
        } satisfies API_PurposeSeed);
      expect(response.statusCode).toBe(201);
    },
  );

  it.each(notAllowedEserviceVersionStates)(
    "should return 409 if the e-service version is %s",
    async (state) => {
      const testEservice = {
        ...getMockEservice({
          latestVersionState: state,
          seed: notAllowedEserviceVersionStates.indexOf(state) + 30,
        }),
        mode: "ProvideData" as const,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body({
          ...body,
          eserviceId: testEservice.id,
        } satisfies API_PurposeSeed);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 404 if no agreement exists for the consumer/eservice pair", async () => {
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
    expect(response.statusCode).toBe(404);
  });

  const allowedAgreementStates: AgreementState[] = ["Active", "Suspended"];
  const notAllowedAgreementStates = AgreementState.options.filter(
    (s) => !allowedAgreementStates.includes(s),
  );

  it.each(allowedAgreementStates)(
    "should succeed if the agreement is %s",
    async (state) => {
      const testEservice = {
        ...getMockEservice({
          latestVersionState: "Active",
          seed: allowedAgreementStates.indexOf(state) + 40,
        }),
        mode: "ProvideData" as const,
      };
      const testConsumerId = generateExternalId<OrganizationId>();
      await eserviceWriterService.upsertEservice(testEservice, 1);
      await agreementWriterService.upsertAgreement(
        {
          ...getMockAgreement({
            seed: allowedAgreementStates.indexOf(state) + 40,
          }),
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          eserviceId: testEservice.id,
          eserviceVersionId: testEservice.versions[0]!.id,
          producerId: testEservice.producerId,
          state,
        },
        1,
      );

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body({
          ...body,
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          eserviceId: testEservice.id,
        } satisfies API_PurposeSeed);
      expect(response.statusCode).toBe(201);
    },
  );

  it.each(notAllowedAgreementStates)(
    "should return 409 if the agreement is %s",
    async (state) => {
      const testEservice = {
        ...getMockEservice({
          latestVersionState: "Active",
          seed: notAllowedAgreementStates.indexOf(state) + 50,
        }),
        mode: "ProvideData" as const,
      };
      const testConsumerId = generateExternalId<OrganizationId>();
      await eserviceWriterService.upsertEservice(testEservice, 1);
      await agreementWriterService.upsertAgreement(
        {
          ...getMockAgreement({
            seed: notAllowedAgreementStates.indexOf(state) + 50,
          }),
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          eserviceId: testEservice.id,
          eserviceVersionId: testEservice.versions[0]!.id,
          producerId: testEservice.producerId,
          state,
        },
        1,
      );

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body({
          ...body,
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          eserviceId: testEservice.id,
        } satisfies API_PurposeSeed);
      expect(response.statusCode).toBe(409);
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

  it("should return 400 if form answers are missing required fields", async () => {
    await setupEserviceAndAgreement();

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        formAnswersJson: {},
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if form answers have invalid field values", async () => {
    await setupEserviceAndAgreement();

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        formAnswersJson: {
          purpose: "INVALID_VALUE",
          purposeDescription: "test",
        },
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if form answers fail conditional validation", async () => {
    await setupEserviceAndAgreement();

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        ...body,
        formAnswersJson: {
          legalBasis: ["PUBLIC_INTEREST"],
          // Missing publicInterestReasons and legalBasisPublicInterest
          personalDataTypes: ["WITH_IDENTIFYING_DATA"],
          purpose: "INSTITUTIONAL",
          usesThirdPartyPersonalData: "NO",
        },
      } satisfies API_PurposeSeed);
    expect(response.statusCode).toBe(400);
  });

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
