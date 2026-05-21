/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { SignalHubSignalSQL } from "@knodia/db-signal-hub";
import type { Eservice } from "@knodia/eservice-models";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { generateId } from "@knodia/common-models/ids";
import {
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_Signal } from "../src/models/api.ts";

import { toSignalType } from "../src/models/apiConverter.ts";
import {
  eserviceNotActive,
  eserviceNotFound,
  eserviceSignalHubNotEnabled,
  nonConsecutiveSignalId,
  signalAlreadyExists,
} from "../src/models/errors.ts";
import { eserviceWriterService } from "./setup.ts";
import { getAllSignals, injectAppRequest } from "./utils.ts";

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
      signalType: toSignalType(defaultBody.signalType),
    };
    const retrievedSignals = await getAllSignals();
    expect(retrievedSignals).toHaveLength(1);
    expect(retrievedSignals[0]).toEqual(expectedSignal);
  });

  it("should return 404 when the e-service does not exist", async () => {
    const response = await pushSignal({
      ...defaultBody,
      eserviceId: generateId(),
    });

    expect(response.statusCode).toBe(404);
  });

  it("should return 404 when the e-service does not belong to the caller", async () => {
    const otherProducerEservice: Eservice = {
      ...eservice,
      producerId: generateId(),
    };
    await seedEservice(otherProducerEservice);

    const response = await pushSignal();

    const error = eserviceNotFound(otherProducerEservice.id);

    expect(response.statusCode).toBe(404);
    expect(response.json<API_Problem>().title).toEqual(error.title);
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
    expect(response.json<API_Problem>().title).toEqual(error.title);
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
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 400 when a signal with the same signalId already exists", async () => {
    await seedEservice();
    await pushSignal();

    const response = await pushSignal();

    const error = signalAlreadyExists(defaultBody.signalId, eservice.id);

    expect(response.statusCode).toBe(400);
    expect(response.json<API_Problem>().title).toEqual(error.title);
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
    expect(response.json<API_Problem>().title).toEqual(error.title);
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
    expect(response.json<API_Problem>().title).toEqual(error.title);
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
