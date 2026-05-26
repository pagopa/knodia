/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Eservice } from "@knodia/eservice-models";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import {
  type CorrelationId,
  type EserviceId,
  generateId,
} from "@knodia/common-models/ids";
import {
  signalHubSignal,
  type SignalHubSignalSQL,
} from "@knodia/db-signal-hub";
import { SignalType } from "@knodia/signal-hub-models";
import {
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Signal } from "../src/models/api.ts";

import {
  eserviceNotActive,
  eserviceNotFound,
  eserviceSignalHubNotEnabled,
  nonConsecutiveSignalId,
  organizationNotAuthorizedToPushSignals,
  signalAlreadyExists,
} from "../src/models/errors.ts";
import { eserviceWriterService, signalHubDb } from "./setup.ts";
import { checkErrorDetail, getAllSignals, injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "knode-api" }];

const producerId = TEST_ORGANIZATION_ID;

const eservice = {
  ...getMockEservice({ latestVersionState: "Active" }),
  isSignalHubEnabled: true,
  producerId,
};

const defaultBody: API_Signal = {
  eserviceId: eservice.id,
  objectId: "test-object-id",
  objectType: "test-object-type",
  signalId: 1,
  signalType: "CREATE",
};

const pushSignal = (body: API_Signal = defaultBody) =>
  injectAppRequest(allowedTestTokens[0]!).post("/signals").body(body);

const seedEservice = (inputEservice = eservice) =>
  eserviceWriterService.upsertEservice(inputEservice, 0);

describe("POST /signals (pushSignal)", () => {
  it("should return 200 and the signalId when the signal is pushed successfully", async () => {
    await seedEservice();

    const response = await pushSignal();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ signalId: defaultBody.signalId });

    const expectedSignal: SignalHubSignalSQL = {
      correlationId: expect.any(String),
      createdAt: expect.any(Date),
      eserviceId: defaultBody.eserviceId,
      id: 1,
      objectId: defaultBody.objectId,
      objectType: defaultBody.objectType,
      signalId: defaultBody.signalId,
      signalType: SignalType.enum.Create,
    };
    const retrievedSignals = await getAllSignals();
    expect(retrievedSignals).toHaveLength(1);
    expect(retrievedSignals[0]).toEqual(expectedSignal);
  });

  it("should store null object columns for a SeedUpdate signal (no object)", async () => {
    await seedEservice();

    const seedUpdateBody: API_Signal = {
      eserviceId: eservice.id,
      signalId: 1,
      signalType: "SEEDUPDATE",
    };
    const response = await pushSignal(seedUpdateBody);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ signalId: seedUpdateBody.signalId });

    const expectedSignal: SignalHubSignalSQL = {
      correlationId: expect.any(String),
      createdAt: expect.any(Date),
      eserviceId: seedUpdateBody.eserviceId,
      id: 1,
      objectId: null,
      objectType: null,
      signalId: seedUpdateBody.signalId,
      signalType: SignalType.enum.SeedUpdate,
    };
    const retrievedSignals = await getAllSignals();
    expect(retrievedSignals).toHaveLength(1);
    expect(retrievedSignals[0]).toEqual(expectedSignal);
  });

  it("should return 404 when the e-service does not exist", async () => {
    const nonExistingEserviceId = generateId<EserviceId>();
    const response = await pushSignal({
      ...defaultBody,
      eserviceId: nonExistingEserviceId,
    });

    const error = eserviceNotFound(nonExistingEserviceId);

    expect(response.statusCode).toBe(404);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it("should return 403 when the e-service does not belong to the caller", async () => {
    const otherProducerEservice: Eservice = {
      ...eservice,
      producerId: generateId(),
    };
    await seedEservice(otherProducerEservice);

    const response = await pushSignal();

    const error = organizationNotAuthorizedToPushSignals(
      otherProducerEservice.id,
      producerId,
    );

    expect(response.statusCode).toBe(403);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it("should return 409 when signal hub is not enabled for the e-service", async () => {
    const eserviceWithoutSignalHubEnabled: Eservice = {
      ...eservice,
      isSignalHubEnabled: false,
    };
    await seedEservice(eserviceWithoutSignalHubEnabled);

    const response = await pushSignal();

    const error = eserviceSignalHubNotEnabled(
      eserviceWithoutSignalHubEnabled.id,
    );

    expect(response.statusCode).toBe(409);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it("should return 409 when the e-service has no active version", async () => {
    const inactiveEservice: Eservice = {
      ...getMockEservice({ latestVersionState: "Archived" }),
      isSignalHubEnabled: true,
      producerId,
    };
    await seedEservice(inactiveEservice);

    const response = await pushSignal();

    const error = eserviceNotActive(inactiveEservice.id);

    expect(response.statusCode).toBe(409);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it("should return 400 when a signal with the same signalId already exists", async () => {
    await seedEservice();
    await pushSignal();

    const response = await pushSignal();

    const error = signalAlreadyExists(defaultBody.signalId, eservice.id);

    expect(response.statusCode).toBe(400);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it("should return 400 when signals with a higher signalId already exist", async () => {
    await seedEservice();

    await pushSignal();
    await pushSignal({
      ...defaultBody,
      signalId: defaultBody.signalId + 1,
    });

    const response = await pushSignal();

    const error = signalAlreadyExists(defaultBody.signalId, eservice.id);

    expect(response.statusCode).toBe(400);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it("should return 400 when the request signalId is not consecutive", async () => {
    await seedEservice();

    await pushSignal();

    const wrongSignalId = defaultBody.signalId + 10;
    const response = await pushSignal({
      ...defaultBody,
      signalId: wrongSignalId,
    });

    const error = nonConsecutiveSignalId(
      wrongSignalId,
      defaultBody.signalId,
      eservice.id,
    );

    expect(response.statusCode).toBe(400);
    checkErrorDetail(response.json<API_Problem>(), error);
  });

  it.each([
    ["invalid property", { ...defaultBody, wrongProperty: "wrong" }],
    ["eserviceId is not a uuid", { ...defaultBody, eserviceId: 99 }],
    ["signalId is negative", { ...defaultBody, signalId: -1 }],
    ["invalid signalType", { ...defaultBody, signalType: "wrong-signal-type" }],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await pushSignal(body as never);
      expect(response.statusCode).toBe(400);
    },
  );
});

describe("POST /signals (pushSignal) - signal shape per signalType", () => {
  it.each([
    [
      "Create signal without objectId/objectType",
      { eserviceId: eservice.id, signalId: 1, signalType: "CREATE" },
    ],
    [
      "SeedUpdate signal carrying objectId/objectType",
      {
        eserviceId: eservice.id,
        objectId: "x",
        objectType: "y",
        signalId: 1,
        signalType: "SEEDUPDATE",
      },
    ],
  ])(
    "should return 400 when the signal shape does not match its signalType - %s",
    async (_label, body) => {
      await seedEservice();
      const response = await pushSignal(body as never);
      expect(response.statusCode).toBe(400);
    },
  );
});

describe("signal table object-column CHECK constraint", () => {
  const checkEserviceId = generateId<EserviceId>();

  it("rejects a SeedUpdate row that carries object columns", async () => {
    await expect(
      signalHubDb.insert(signalHubSignal).values({
        correlationId: generateId<CorrelationId>(),
        eserviceId: checkEserviceId,
        objectId: "x",
        objectType: "y",
        signalId: 1,
        signalType: SignalType.enum.SeedUpdate,
      }),
    ).rejects.toThrow();
  });

  it("rejects a non-SeedUpdate row with null object columns", async () => {
    await expect(
      signalHubDb.insert(signalHubSignal).values({
        correlationId: generateId<CorrelationId>(),
        eserviceId: checkEserviceId,
        objectId: null,
        objectType: null,
        signalId: 2,
        signalType: SignalType.enum.Create,
      }),
    ).rejects.toThrow();
  });
});
