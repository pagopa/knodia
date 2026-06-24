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

import { toAPI_FlatEservice } from "../src/models/apiConverter.ts";
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
      ...toAPI_FlatEservice(eservice),
      updatedAt: expect.any(String),
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
