/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Eservice } from "@knodia/eservice-models";
import type { API_Problem } from "@knodia/fastify-zod-api-commons/models";

import { generateId } from "@knodia/common-models/ids";
import {
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { getMockEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { API_PushSeed } from "../src/models/api.ts";

import {
  eserviceNotActive,
  eserviceNotFoundForProducer,
  eserviceSignalHubNotEnabled,
  signalAlreadyExists,
  signalsWithHigherIdExist,
} from "../src/models/errors.ts";
import {
  eserviceWriterService,
  signalHubDbService,
  timeWindowInSeconds,
} from "./setup.ts";
import { injectAppRequest } from "./utils.ts";

const allowedTestTokens: TestToken[] = [{ type: "knode-api" }];

const producerId = TEST_ORGANIZATION_ID;

const eservice = {
  ...getMockEservice({ latestVersionState: "Active" }),
  isSignalHubEnabled: true,
  producerId,
};

const defaultBody: API_PushSeed = {
  eserviceId: eservice.id,
  objectId: "object-id-test",
  objectType: "object-type-test",
  signalId: 1,
  signalType: "CREATE",
};

const pushSignal = (body: API_PushSeed = defaultBody) =>
  injectAppRequest(allowedTestTokens[0]!).post("/signals").body(body);

const seedEservice = (inputEservice = eservice) =>
  eserviceWriterService.upsertEservice(inputEservice, 0);

describe("POST /signals (pushSignal)", () => {
  it("should return 200 and the signalId when the signal is pushed successfully", async () => {
    await seedEservice();

    const response = await pushSignal(defaultBody);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toBe(defaultBody.signalId);
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

    const error = eserviceNotFoundForProducer(
      otherProducerEservice.id,
      otherProducerEservice.producerId,
    );

    expect(response.statusCode).toBe(404);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 403 when signal hub is not enabled for the e-service", async () => {
    const eserviceWithoutSignalHubEnabled: Eservice = {
      ...eservice,
      isSignalHubEnabled: false,
    };
    await seedEservice(eserviceWithoutSignalHubEnabled);

    const response = await pushSignal();

    const error = eserviceSignalHubNotEnabled(
      eserviceWithoutSignalHubEnabled.id,
    );

    expect(response.statusCode).toBe(403);
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

  it("should return 409 when a signal with the same signalId already exists", async () => {
    await seedEservice();
    await pushSignal();

    const response = await pushSignal(defaultBody);

    const error = signalAlreadyExists(defaultBody.signalId, eservice.id);

    expect(response.statusCode).toBe(409);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });

  it("should return 409 when a signal with a higher signalId was already consolidated", async () => {
    await seedEservice();

    // Insert directly with a backdated createdAt so it's already past the time window
    await signalHubDbService.insertSignal({
      ...defaultBody,
      correlationId: generateId(),
      createdAt: new Date(Date.now() - timeWindowInSeconds * 1000 - 1),
      signalId: 10,
    });

    const lowerSignalId = 5;
    const response = await pushSignal({
      ...defaultBody,
      signalId: lowerSignalId,
    });

    const error = signalsWithHigherIdExist(
      lowerSignalId,
      eservice.id,
      timeWindowInSeconds,
    );

    expect(response.statusCode).toBe(409);
    expect(response.json<API_Problem>().title).toEqual(error.title);
  });
});
