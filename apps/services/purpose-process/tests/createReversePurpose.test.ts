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
  getMockPurposeFormPrefill,
  MOCK_PURPOSE_FORM_ANSWERS,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Purpose, API_ReversePurposeSeed } from "../src/models/api.ts";

import { agreementWriterService, eserviceWriterService } from "./setup.ts";
import {
  getAllPurposeEvents,
  injectAppRequest,
  toExpectAPI_Purpose,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const consumerId = generateExternalId<OrganizationId>();
const consumerKnodeId = KnodeId.parse("Orion");

const buildReceiveDataEservice = (opts: { seed?: number } = {}) => {
  // Distinct formAnswersJson per PFA so tests can assert the chosen one was
  // snapshotted (default mock would otherwise return identical answers).
  const purposeFormPrefills = [
    {
      ...getMockPurposeFormPrefill(opts.seed ?? 0),
      formAnswersJson: { ...MOCK_PURPOSE_FORM_ANSWERS, marker: "first-pfp" },
    },
    {
      ...getMockPurposeFormPrefill((opts.seed ?? 0) + 100),
      formAnswersJson: { ...MOCK_PURPOSE_FORM_ANSWERS, marker: "second-pfp" },
    },
  ];
  return {
    ...getMockEservice({
      latestVersionState: "Active",
      purposeFormPrefills,
      seed: opts.seed,
    }),
    mode: EserviceMode.enum.ReceiveData,
  };
};

const setupEserviceAndAgreement = async (
  eservice: Awaited<ReturnType<typeof buildReceiveDataEservice>>,
) => {
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

describe("POST /purposes/receive-mode (createReversePurpose)", () => {
  it.each(allowedTestTokens)(
    "should create a Purpose snapshotting the chosen PurposeFormPrefill ($type)",
    async (token) => {
      const eservice = buildReceiveDataEservice();
      // Pick the SECOND PFA on purpose: ensures the service looks up by id
      // rather than blindly picking purposeFormPrefills[0].
      const chosen = eservice.receiveDataConfig!.purposeFormPrefills[1]!;
      await setupEserviceAndAgreement(eservice);

      const body: API_ReversePurposeSeed = {
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "Test reverse purpose description" },
        eserviceId: eservice.id,
        name: { en: "Test Reverse Purpose" },
        purposeFormPrefillId: chosen.id,
      };

      const response = await injectAppRequest(token)
        .post("/purposes/receive-mode")
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
        formAnswersJson: chosen.formAnswersJson,
        formSchemaVersion: PurposeFormSchemaVersion.enum["1.0"],
        id: expect.any(String),
        name: body.name,
        state: "Active",
        suspendedByConsumerAt: null,
        suspendedByProducerAt: null,
        updatedAt: new Date(responseBody.updatedAt),
      };

      expect(responseBody).toMatchObject(toExpectAPI_Purpose(expectedPurpose));
      expect(responseBody).not.toHaveProperty("template");

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
      expect(createdPurpose.formAnswersJson).toEqual(chosen.formAnswersJson);
      expect(createdPurpose.formSchemaVersion).toEqual(
        chosen.formSchemaVersion,
      );
      expect(createdPurpose.template).toBeUndefined();
    },
  );

  it.each(forbiddenTestTokens([{ type: "internal" }]))(
    "should return 401/403 for $type token",
    async (token) => {
      const response = await injectAppRequest(token)
        .post("/purposes/receive-mode")
        .body({
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          dailyCalls: 1,
          description: { en: "A valid test description for receive-mode" },
          eserviceId: generateId(),
          name: { en: "Valid Test Name" },
          purposeFormPrefillId: generateId(),
        } satisfies API_ReversePurposeSeed);
      expect([401, 403]).toContain(response.statusCode);
    },
  );

  it("should reject a body that carries unknown fields (e.g. inline formAnswersJson)", async () => {
    const eservice = buildReceiveDataEservice({ seed: 5 });
    await setupEserviceAndAgreement(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes/receive-mode")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-mode" },
        eserviceId: eservice.id,
        formAnswersJson: { foo: "bar" },
        name: { en: "Valid Test Name" },
        purposeFormPrefillId:
          eservice.receiveDataConfig!.purposeFormPrefills[0]!.id,
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 404 if the e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes/receive-mode")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-mode" },
        eserviceId: generateId(),
        name: { en: "Valid Test Name" },
        purposeFormPrefillId: generateId(),
      } satisfies API_ReversePurposeSeed);
    expect(response.statusCode).toBe(404);
  });

  const notAllowedEserviceModes = EserviceMode.options.filter(
    (m) => m !== EserviceMode.enum.ReceiveData,
  );

  it.each(notAllowedEserviceModes)(
    "should return 409 if the e-service mode is %s",
    async (mode) => {
      const testEservice = {
        ...getMockEservice({
          latestVersionState: "Active",
          seed: 60 + notAllowedEserviceModes.indexOf(mode),
        }),
        mode,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);
      await agreementWriterService.upsertAgreement(
        {
          ...getMockAgreement({
            seed: 60 + notAllowedEserviceModes.indexOf(mode),
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
        .post("/purposes/receive-mode")
        .body({
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          dailyCalls: 1000,
          description: { en: "A valid test description for receive-mode" },
          eserviceId: testEservice.id,
          name: { en: "Valid Test Name" },
          purposeFormPrefillId: generateId(),
        } satisfies API_ReversePurposeSeed);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 404 if the purposeFormPrefillId is not in the e-service.receiveDataConfig", async () => {
    const eservice = buildReceiveDataEservice({ seed: 10 });
    await setupEserviceAndAgreement(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes/receive-mode")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-mode" },
        eserviceId: eservice.id,
        name: { en: "Valid Test Name" },
        purposeFormPrefillId: generateId(),
      } satisfies API_ReversePurposeSeed);
    expect(response.statusCode).toBe(404);
  });

  const notAllowedEserviceVersionStates = EserviceVersionState.options.filter(
    (s) => s !== "Active" && s !== "Suspended",
  );

  it.each(notAllowedEserviceVersionStates)(
    "should return 409 if the e-service version is %s",
    async (state) => {
      const purposeFormPrefills = [
        getMockPurposeFormPrefill(
          50 + notAllowedEserviceVersionStates.indexOf(state),
        ),
      ];
      const testEservice = {
        ...getMockEservice({
          latestVersionState: state,
          purposeFormPrefills,
          seed: 50 + notAllowedEserviceVersionStates.indexOf(state),
        }),
        mode: EserviceMode.enum.ReceiveData,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes/receive-mode")
        .body({
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          dailyCalls: 1000,
          description: { en: "A valid test description for receive-mode" },
          eserviceId: testEservice.id,
          name: { en: "Valid Test Name" },
          purposeFormPrefillId: purposeFormPrefills[0]!.id,
        } satisfies API_ReversePurposeSeed);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 404 if no agreement exists for the consumer/eservice pair", async () => {
    const eservice = buildReceiveDataEservice({ seed: 20 });
    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes/receive-mode")
      .body({
        consumer: {
          id: generateExternalId<OrganizationId>(),
          knodeId: consumerKnodeId,
        },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-mode" },
        eserviceId: eservice.id,
        name: { en: "Valid Test Name" },
        purposeFormPrefillId:
          eservice.receiveDataConfig!.purposeFormPrefills[0]!.id,
      } satisfies API_ReversePurposeSeed);
    expect(response.statusCode).toBe(404);
  });

  const notAllowedAgreementStates = AgreementState.options.filter(
    (s) => s !== "Active" && s !== "Suspended",
  );

  it.each(notAllowedAgreementStates)(
    "should return 409 if the agreement is %s",
    async (state) => {
      const eservice = buildReceiveDataEservice({
        seed: 30 + notAllowedAgreementStates.indexOf(state),
      });
      const testConsumerId = generateExternalId<OrganizationId>();
      await eserviceWriterService.upsertEservice(eservice, 1);
      await agreementWriterService.upsertAgreement(
        {
          ...getMockAgreement({
            seed: 30 + notAllowedAgreementStates.indexOf(state),
          }),
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          eserviceId: eservice.id,
          eserviceVersionId: eservice.versions[0]!.id,
          producerId: eservice.producerId,
          state,
        },
        1,
      );

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes/receive-mode")
        .body({
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          dailyCalls: 1000,
          description: { en: "A valid test description for receive-mode" },
          eserviceId: eservice.id,
          name: { en: "Valid Test Name" },
          purposeFormPrefillId:
            eservice.receiveDataConfig!.purposeFormPrefills[0]!.id,
        } satisfies API_ReversePurposeSeed);
      expect(response.statusCode).toBe(409);
    },
  );
});
