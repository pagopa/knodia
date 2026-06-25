/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  EserviceEventV1,
  EserviceVersionState,
  fromEserviceV1,
} from "@knodia/eservice-models";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import {
  getAllEserviceEvents,
  injectAppRequest,
  makeEserviceWithVersionState,
  seedEservice,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /eservices/:eserviceId/suspend (suspendEservice)", () => {
  it("should suspend an active e-service", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      100,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/suspend`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const responseBody = response.json();
    expect(responseBody).toEqual({
      categories: expect.arrayContaining(eservice.categories),
      createdAt: eservice.createdAt.toISOString(),
      description: eservice.description,
      id: eservice.id,
      isConsumerOperatorIdentificationRequired:
        eservice.isConsumerOperatorIdentificationRequired,
      isSignalHubEnabled: eservice.isSignalHubEnabled,
      mode: eservice.mode,
      name: eservice.name,
      producerId: eservice.producerId,
      ...(eservice.template !== undefined
        ? { template: eservice.template }
        : {}),
      ...(eservice.receiveDataConfig !== undefined
        ? { receiveDataConfig: eservice.receiveDataConfig }
        : {}),
      updatedAt: expect.any(String),
      versions: eservice.versions.map((v) =>
        expect.objectContaining({
          accessTokenAudience: expect.arrayContaining(v.accessTokenAudience),
          accessTokenDuration: v.accessTokenDuration,
          accessTokenType: v.accessTokenType,
          createdAt: v.createdAt.toISOString(),
          id: v.id,
          maxDailyCallsPerConsumer: v.maxDailyCallsPerConsumer,
          maxDailyCallsPerKnode: v.maxDailyCallsPerKnode,
          requiredAttributes: v.requiredAttributes.map((g) =>
            expect.arrayContaining(g),
          ),
          state: EserviceVersionState.enum.Suspended,
          updatedAt: expect.any(String),
          versionNumber: v.versionNumber,
        }),
      ),
    });

    const events = await getAllEserviceEvents();
    expect(events).toHaveLength(2);

    const suspendEvent = events[1];
    expect(suspendEvent).toMatchObject({
      streamId: eservice.id,
      type: "EserviceVersionSuspendedV1",
      version: 1,
    });

    const eventData = EserviceEventV1.parse(suspendEvent).data;
    const eserviceFromEvent = fromEserviceV1(eventData.eservice!);
    expect(eserviceFromEvent.versions[0]!.state).toBe(
      EserviceVersionState.enum.Suspended,
    );
  });

  it("should return 409 if e-service is already suspended", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Suspended,
      101,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/suspend`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if e-service is archived", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Archived,
      102,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/suspend`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("should return 403 if caller is not the producer", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      103,
      generateId<OrganizationId>(),
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/suspend`,
    );

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${generateId()}/suspend`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const eservice = makeEserviceWithVersionState(
        EserviceVersionState.enum.Active,
        104,
      );
      await seedEservice(eservice);

      const response = await injectAppRequest(spec).post(
        `/eservices/${eservice.id}/suspend`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
