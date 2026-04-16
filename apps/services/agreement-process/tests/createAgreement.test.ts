/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type Agreement,
  AgreementEventV1,
  AgreementState,
  toAgreementV1,
} from "@knodia/agreement-models";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  KnodeId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import {
  type Eservice,
  type EserviceVersion,
  EserviceVersionState,
} from "@knodia/eservice-models";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import {
  getMockAgreement,
  getMockEservice,
  getMockEserviceVersion,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  type API_Agreement,
  type API_AgreementSeed,
} from "../src/models/api.ts";
import { toAPI_Agreement } from "../src/models/apiConverter.ts";
import { agreementCreationConflictingStates } from "../src/utils/validators.ts";
import { agreementWriterService, eserviceWriterService } from "./setup.ts";
import { getAllAgreementEvents, injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "internal" }];

describe("POST /agreements (createAgreement)", async () => {
  const eservice: Eservice = {
    ...getMockEservice({
      latestVersionState: "Active",
    }),
    isConsumerOperatorIdentificationRequired: false,
  };
  const eserviceVersion = eservice.versions[0]!;
  const consumerId = generateExternalId<OrganizationId>();

  const consumerAttributes = eserviceVersion.requiredAttributes.map(
    (group) => group[0]!,
  );

  const body: API_AgreementSeed = {
    consumer: {
      attributes: consumerAttributes,
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
        attributes: consumerAttributes,
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

  it("should create agreement in PendingConsumerOperatorIdentification state when isConsumerOperatorIdentificationRequired is true", async () => {
    const pendingEservice: Eservice = {
      ...getMockEservice({
        latestVersionState: "Active",
        seed: 50,
      }),
      isConsumerOperatorIdentificationRequired: true,
    };
    await eserviceWriterService.upsertEservice(pendingEservice, 1);

    const pendingConsumerAttributes =
      pendingEservice.versions[0]!.requiredAttributes.map((group) => group[0]!);

    const pendingBody: API_AgreementSeed = {
      consumer: {
        attributes: pendingConsumerAttributes,
        id: consumerId,
        knodeId: "Orion",
      },
      eserviceId: pendingEservice.id,
      eserviceVersionId: pendingEservice.versions[0]!.id,
    };

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body(pendingBody);

    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Agreement>();
    expect(responseBody.state).toBe("PendingConsumerOperatorIdentification");

    const events = await getAllAgreementEvents();
    expect(events).toHaveLength(1);

    const createdEvent = events[0];
    expect(createdEvent).toMatchObject({
      streamId: responseBody.id,
      type: "AgreementCreatedPendingConsumerOperatorIdentificationV1",
      version: 0,
    });
  });

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

  it("should return 404 if the e-service latest version does not exist", async () => {
    await eserviceWriterService.upsertEservice(
      { ...eservice, versions: [] },
      1,
    );

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body({
        ...body,
        eserviceId: eservice.id,
        eserviceVersionId: generateId(),
      } satisfies API_AgreementSeed);
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
      const testEservice: Eservice = {
        ...getMockEservice({
          latestVersionState: state,
          seed: allowedEserviceVersionStates.indexOf(state) + 10,
        }),
        isConsumerOperatorIdentificationRequired: false,
      };
      await eserviceWriterService.upsertEservice(testEservice, 1);

      const testConsumerAttributes =
        testEservice.versions[0]!.requiredAttributes.map((group) => group[0]!);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
        .body({
          ...body,
          consumer: { ...body.consumer, attributes: testConsumerAttributes },
          eserviceId: testEservice.id,
          eserviceVersionId: testEservice.versions[0]!.id,
        } satisfies API_AgreementSeed);
      expect(response.statusCode).toBe(201);
    },
  );

  it.each(notAllowedEserviceVersionStates)(
    "should return 409 if the e-service version is %s",
    async (state) => {
      const testEservice = getMockEservice({
        latestVersionState: state,
        seed: notAllowedEserviceVersionStates.indexOf(state) + 30,
      });
      await eserviceWriterService.upsertEservice(testEservice, 1);

      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/agreements")
        .body({
          ...body,
          eserviceId: testEservice.id,
          eserviceVersionId: testEservice.versions[0]!.id,
        } satisfies API_AgreementSeed);
      expect(response.statusCode).toBe(409);
    },
  );

  it("should return 409 if the e-service version is not the latest", async () => {
    const eserviceVersion1: EserviceVersion = {
      ...getMockEserviceVersion(),
      versionNumber: 1,
    };
    const eserviceVersion2: EserviceVersion = {
      ...getMockEserviceVersion(1),
      versionNumber: 2,
    };
    const eserviceWithMultipleVersions: Eservice = {
      ...eservice,
      versions: [eserviceVersion1, eserviceVersion2],
    };

    await eserviceWriterService.upsertEservice(eserviceWithMultipleVersions, 1);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/agreements")
      .body({
        ...body,
        eserviceId: eserviceWithMultipleVersions.id,
        eserviceVersionId: eserviceVersion1.id,
      } satisfies API_AgreementSeed);
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

describe("POST /agreements - attribute validation", async () => {
  const eservice: Eservice = {
    ...getMockEservice({ latestVersionState: "Active" }),
    isConsumerOperatorIdentificationRequired: false,
  };
  const eserviceVersion = eservice.versions[0]!;
  const consumerId = generateExternalId<OrganizationId>();
  const validAttributes = eserviceVersion.requiredAttributes.map(
    (group) => group[0]!,
  );
  const body: API_AgreementSeed = {
    consumer: { attributes: validAttributes, id: consumerId, knodeId: "Orion" },
    eserviceId: eservice.id,
    eserviceVersionId: eserviceVersion.id,
  };

  it("should return 201 and only save matching attributes when consumer has extra unrelated attributes", async () => {
    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest({ type: "internal" })
      .post("/agreements")
      .body({
        ...body,
        consumer: {
          ...body.consumer,
          attributes: [...validAttributes, { code: "extra", scheme: "extra" }],
        },
      });
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Agreement>();
    expect(responseBody.attributes).toEqual(
      expect.arrayContaining(validAttributes),
    );
    expect(responseBody.attributes).not.toContainEqual({
      code: "extra",
      scheme: "extra",
    });
  });

  it("should return 403 when consumer does not possess any required attribute", async () => {
    await eserviceWriterService.upsertEservice(eservice, 1);

    const response = await injectAppRequest({ type: "internal" })
      .post("/agreements")
      .body({
        ...body,
        consumer: {
          ...body.consumer,
          attributes: [{ code: "unknown", scheme: "unknown" }],
        },
      } satisfies API_AgreementSeed);
    expect(response.statusCode).toBe(403);
  });

  it("should return 403 when consumer fails to satisfy one attribute group", async () => {
    const eserviceWith2Groups = getMockEservice({
      latestVersionState: "Active",
      minArrayLength: 2,
    });
    const version = eserviceWith2Groups.versions[0]!;
    await eserviceWriterService.upsertEservice(eserviceWith2Groups, 1);

    const response = await injectAppRequest({ type: "internal" })
      .post("/agreements")
      .body({
        consumer: {
          ...body.consumer,
          attributes: [version.requiredAttributes[0]![0]!],
        },
        eserviceId: eserviceWith2Groups.id,
        eserviceVersionId: version.id,
      } satisfies API_AgreementSeed);
    expect(response.statusCode).toBe(403);
  });
});
