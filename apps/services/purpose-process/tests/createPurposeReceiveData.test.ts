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
  getMockPurposeFormOption,
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

type API_PurposeSeedReceiveData = Extract<
  API_PurposeSeed,
  { eserviceMode: "ReceiveData" }
>;

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

const consumerId = generateExternalId<OrganizationId>();
const consumerKnodeId = KnodeId.parse("Orion");

const buildReceiveDataEservice = (opts: { seed?: number } = {}) => {
  // Distinct formAnswersJson per prefill so tests can assert the chosen one
  // was snapshotted (default mock would otherwise return identical answers).
  const purposeFormOptions = [
    {
      ...getMockPurposeFormOption(opts.seed ?? 0),
      formAnswersJson: { ...MOCK_PURPOSE_FORM_ANSWERS, marker: "first-pfp" },
    },
    {
      ...getMockPurposeFormOption((opts.seed ?? 0) + 100),
      formAnswersJson: { ...MOCK_PURPOSE_FORM_ANSWERS, marker: "second-pfp" },
    },
  ];
  return {
    ...getMockEservice({
      latestVersionState: "Active",
      purposeFormOptions,
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

describe("POST /purposes (ReceiveData mode)", () => {
  it.each(allowedTestTokens)(
    "should create a Purpose snapshotting the chosen PurposeFormOption ($type)",
    async (token) => {
      const eservice = buildReceiveDataEservice();
      // Pick the SECOND prefill on purpose: ensures the service looks up by
      // id rather than blindly picking purposeFormOptions[0].
      const chosen = eservice.receiveDataConfig!.purposeFormOptions[1]!;
      await setupEserviceAndAgreement(eservice);

      const body: API_PurposeSeedReceiveData = {
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "Test ReceiveData purpose description" },
        eserviceId: eservice.id,
        eserviceMode: "ReceiveData",
        name: { en: "Test ReceiveData Purpose" },
        purposeFormOptionId: chosen.id,
      };

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
        .post("/purposes")
        .body({
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          dailyCalls: 1,
          description: { en: "A valid test description for receive-data" },
          eserviceId: generateId(),
          eserviceMode: "ReceiveData",
          name: { en: "Valid Test Name" },
          purposeFormOptionId: generateId(),
        } satisfies API_PurposeSeedReceiveData);
      expect([401, 403]).toContain(response.statusCode);
    },
  );

  it("should reject a body that carries unknown fields (e.g. inline formAnswersJson)", async () => {
    const eservice = buildReceiveDataEservice({ seed: 5 });
    await setupEserviceAndAgreement(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-data" },
        eserviceId: eservice.id,
        eserviceMode: "ReceiveData",
        formAnswersJson: { foo: "bar" },
        name: { en: "Valid Test Name" },
        purposeFormOptionId:
          eservice.receiveDataConfig!.purposeFormOptions[0]!.id,
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 404 if the e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-data" },
        eserviceId: generateId(),
        eserviceMode: "ReceiveData",
        name: { en: "Valid Test Name" },
        purposeFormOptionId: generateId(),
      } satisfies API_PurposeSeedReceiveData);
    expect(response.statusCode).toBe(404);
  });

  const notAllowedEserviceModes = EserviceMode.options.filter(
    (m) => m !== EserviceMode.enum.ReceiveData,
  );

  it.each(notAllowedEserviceModes)(
    "should return 409 if the e-service mode is %s (mode mismatch)",
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
        .post("/purposes")
        .body({
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          dailyCalls: 1000,
          description: { en: "A valid test description for receive-data" },
          eserviceId: testEservice.id,
          eserviceMode: "ReceiveData",
          name: { en: "Valid Test Name" },
          purposeFormOptionId: generateId(),
        } satisfies API_PurposeSeedReceiveData);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 404 if the purposeFormOptionId is not in the e-service.receiveDataConfig", async () => {
    const eservice = buildReceiveDataEservice({ seed: 10 });
    await setupEserviceAndAgreement(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-data" },
        eserviceId: eservice.id,
        eserviceMode: "ReceiveData",
        name: { en: "Valid Test Name" },
        purposeFormOptionId: generateId(),
      } satisfies API_PurposeSeedReceiveData);
    expect(response.statusCode).toBe(404);
  });

  it("should return 500 if the e-service is in ReceiveData mode but has no receiveDataConfig (data-integrity anomaly)", async () => {
    const eservice = {
      ...getMockEservice({ latestVersionState: "Active", seed: 15 }),
      mode: EserviceMode.enum.ReceiveData,
      receiveDataConfig: undefined,
    };
    await eserviceWriterService.upsertEservice(eservice, 1);
    await agreementWriterService.upsertAgreement(
      {
        ...getMockAgreement({ seed: 15 }),
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        eserviceId: eservice.id,
        eserviceVersionId: eservice.versions[0]!.id,
        producerId: eservice.producerId,
        state: "Active",
      },
      1,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-data" },
        eserviceId: eservice.id,
        eserviceMode: "ReceiveData",
        name: { en: "Valid Test Name" },
        purposeFormOptionId: generateId(),
      } satisfies API_PurposeSeedReceiveData);
    expect(response.statusCode).toBe(500);
  });

  it("should return 400 if the snapshotted form answers fail schema validation", async () => {
    // Producer slipped a malformed prefill past its own publish-time check:
    // assertFormAnswersAreValid runs in the service as a safety net.
    const baseEservice = buildReceiveDataEservice({ seed: 17 });
    const malformedPrefill = {
      ...baseEservice.receiveDataConfig!.purposeFormOptions[0]!,
      formAnswersJson: { purpose: "INVALID_VALUE" },
    };
    const eservice = {
      ...baseEservice,
      receiveDataConfig: { purposeFormOptions: [malformedPrefill] },
    };
    await setupEserviceAndAgreement(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        consumer: { id: consumerId, knodeId: consumerKnodeId },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-data" },
        eserviceId: eservice.id,
        eserviceMode: "ReceiveData",
        name: { en: "Valid Test Name" },
        purposeFormOptionId: malformedPrefill.id,
      } satisfies API_PurposeSeedReceiveData);
    expect(response.statusCode).toBe(400);
  });

  const notAllowedEserviceVersionStates = EserviceVersionState.options.filter(
    (s) => s !== "Active" && s !== "Suspended",
  );

  it.each(notAllowedEserviceVersionStates)(
    "should return 409 if the e-service version is %s",
    async (state) => {
      const purposeFormOptions = [
        getMockPurposeFormOption(
          50 + notAllowedEserviceVersionStates.indexOf(state),
        ),
      ];
      const testEservice = {
        ...getMockEservice({
          latestVersionState: state,
          purposeFormOptions,
          seed: 50 + notAllowedEserviceVersionStates.indexOf(state),
        }),
        mode: EserviceMode.enum.ReceiveData,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/purposes")
        .body({
          consumer: { id: consumerId, knodeId: consumerKnodeId },
          dailyCalls: 1000,
          description: { en: "A valid test description for receive-data" },
          eserviceId: testEservice.id,
          eserviceMode: "ReceiveData",
          name: { en: "Valid Test Name" },
          purposeFormOptionId: purposeFormOptions[0]!.id,
        } satisfies API_PurposeSeedReceiveData);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 404 if no agreement exists for the consumer/eservice pair", async () => {
    const eservice = buildReceiveDataEservice({ seed: 20 });
    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/purposes")
      .body({
        consumer: {
          id: generateExternalId<OrganizationId>(),
          knodeId: consumerKnodeId,
        },
        dailyCalls: 1000,
        description: { en: "A valid test description for receive-data" },
        eserviceId: eservice.id,
        eserviceMode: "ReceiveData",
        name: { en: "Valid Test Name" },
        purposeFormOptionId:
          eservice.receiveDataConfig!.purposeFormOptions[0]!.id,
      } satisfies API_PurposeSeedReceiveData);
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
        .post("/purposes")
        .body({
          consumer: { id: testConsumerId, knodeId: consumerKnodeId },
          dailyCalls: 1000,
          description: { en: "A valid test description for receive-data" },
          eserviceId: eservice.id,
          eserviceMode: "ReceiveData",
          name: { en: "Valid Test Name" },
          purposeFormOptionId:
            eservice.receiveDataConfig!.purposeFormOptions[0]!.id,
        } satisfies API_PurposeSeedReceiveData);
      expect(response.statusCode).toBe(409);
    },
  );
});
