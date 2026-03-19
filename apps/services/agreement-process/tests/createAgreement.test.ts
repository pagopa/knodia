/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  Agreement,
  AgreementEventV1,
  AgreementState,
  toAgreementV1,
} from "@knodia/agreement-models";
import { generateExternalId } from "@knodia/common-models/externalResource";
import { generateId, KnodeId, OrganizationId } from "@knodia/common-models/ids";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { getMockAgreement, getMockEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { API_Agreement, API_AgreementSeed } from "../src/models/api.ts";
import { toAPI_Agreement } from "../src/models/apiConverter.ts";
import { agreementCreationConflictingStates } from "../src/utils/validators.ts";
import { agreementWriterService, eserviceWriterService } from "./setup.ts";
import { getAllAgreementEvents, injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

describe("POST /agreements (createAgreement)", async () => {
  const eservice = getMockEservice({
    latestVersionState: "Active",
  });
  const eserviceVersion = eservice.versions[0]!;
  const consumerId = generateExternalId<OrganizationId>();

  const body: API_AgreementSeed = {
    consumer: {
      id: consumerId,
      knodeId: "Orion",
    },
    eserviceId: eservice.id,
    eserviceVersionId: eservice.versions[0]!.id,
  };

  const allowedAgreementStatesForCreation: (AgreementState | undefined)[] = [
    ...AgreementState.options.filter(
      (state) => !agreementCreationConflictingStates.includes(state),
    ),
    undefined,
  ];
  it.each(allowedAgreementStatesForCreation)(
    "should correctly create agreement creation event (state of the existing agreement: %s)",
    async (state) => {
      if (state) {
        const agreement: Agreement = {
          ...getMockAgreement(),
          consumer: {
            id: consumerId,
            knodeId: KnodeId.parse(body.consumer.knodeId),
          },
          eserviceId: eservice.id,
          state,
        };

        await agreementWriterService.upsertAgreement(agreement, 1);
      }

      await eserviceWriterService.upsertEservice(eservice, 1);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
        .body(body);

      expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
      expect(response.statusCode).toBe(201);

      const responseBody = response.json<API_Agreement>();

      const expectedAgreement: Agreement = {
        attributes: [],
        consumer: {
          id: consumerId,
          knodeId: KnodeId.parse(body.consumer.knodeId),
        },
        createdAt: new Date(responseBody.createdAt),
        eserviceId: eservice.id,
        eserviceVersionId: eserviceVersion.id,
        id: expect.any(String),
        producerId: eservice.producerId,
        state: "Active",
        updatedAt: new Date(responseBody.updatedAt),
      };

      expect(responseBody).toMatchObject(toAPI_Agreement(expectedAgreement));

      const events = await getAllAgreementEvents();
      expect(events).toHaveLength(1);

      const createdEvent = events[0];

      expect(createdEvent).toMatchObject({
        streamId: responseBody.id,
        type: "AgreementActivatedV1",
        version: 0,
      });

      const createdEventData = AgreementEventV1.parse(createdEvent).data;
      expect(createdEventData.agreement).toMatchObject(
        toAgreementV1(expectedAgreement),
      );
    },
  );

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["eserviceId is not a uuid", { ...body, eserviceId: 99 }],
    ["eserviceId is empty", { ...body, eserviceId: "" }],
    ["eserviceVersionId is not a uuid", { ...body, eserviceVersionId: 99 }],
    ["eserviceVersionId is empty", { ...body, eserviceVersionId: "" }],
    [
      "consumerKnodeId is unknown",
      { ...body, consumer: { ...body.consumer, knodeId: "UnknownKnodeId" } },
    ],
    [
      "consumerKnodeId is empty",
      { ...body, consumer: { ...body.consumer, knodeId: "" } },
    ],
    [
      "consumerId is not a uuid",
      { ...body, consumer: { ...body.consumer, id: 99 } },
    ],
    [
      "consumerId is empty",
      { ...body, consumer: { ...body.consumer, id: "" } },
    ],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
        .body(body as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 404 if the e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body({
        ...body,
        eserviceId: generateId(),
      } satisfies API_AgreementSeed);
    expect(response.statusCode).toBe(404);
  });

  it("should return 404 if the e-service version does not exist", async () => {
    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body({
        ...body,
        eserviceId: eservice.id,
        eserviceVersionId: generateId(),
      } satisfies API_AgreementSeed);
    expect(response.statusCode).toBe(404);
  });

  it("should return 409 if the e-service version latest version is not active", async () => {
    const eservice = getMockEservice({
      latestVersionState: "Suspended",
    });

    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body(body);
    expect(response.statusCode).toBe(409);
  });

  it.each(agreementCreationConflictingStates)(
    "should return 409 if an agreement in state %s already exists",
    async (state) => {
      const agreement: Agreement = {
        ...getMockAgreement(),
        consumer: {
          id: consumerId,
          knodeId: KnodeId.parse(body.consumer.knodeId),
        },
        eserviceId: eservice.id,
        state,
      };

      await agreementWriterService.upsertAgreement(agreement, 1);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
        .body(body);
      expect(response.statusCode).toBe(409);
    },
  );

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type, $roles)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/agreements")
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );
});
