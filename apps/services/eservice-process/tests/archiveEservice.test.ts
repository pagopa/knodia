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

import { toAPI_Eservice } from "../src/models/apiConverter.ts";
import {
  getAllEserviceEvents,
  injectAppRequest,
  makeEserviceWithVersionState,
  seedEservice,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /eservices/:eserviceId/archive (archiveEservice)", () => {
  it("should archive a suspended e-service", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Suspended,
      200,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/archive`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const responseBody = response.json();
    expect(responseBody).toMatchObject({
      ...toAPI_Eservice(eservice),
      updatedAt: expect.any(String),
    });

    const events = await getAllEserviceEvents();
    expect(events).toHaveLength(2);

    const archiveEvent = events[1];
    expect(archiveEvent).toMatchObject({
      streamId: eservice.id,
      type: "EserviceVersionArchivedV1",
      version: 1,
    });

    const eventData = EserviceEventV1.parse(archiveEvent).data;
    const eserviceFromEvent = fromEserviceV1(eventData.eservice!);
    expect(eserviceFromEvent.versions[0]!.state).toBe(
      EserviceVersionState.enum.Archived,
    );
  });

  it("should return 409 if e-service is active", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      201,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/archive`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("should return 409 if e-service is already archived", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Archived,
      202,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/archive`,
    );

    expect(response.statusCode).toBe(409);
  });

  it("should return 403 if caller is not the producer", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Suspended,
      203,
      generateId<OrganizationId>(),
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${eservice.id}/archive`,
    );

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!).post(
      `/eservices/${generateId()}/archive`,
    );

    expect(response.statusCode).toBe(404);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const eservice = makeEserviceWithVersionState(
        EserviceVersionState.enum.Suspended,
        204,
      );
      await seedEservice(eservice);

      const response = await injectAppRequest(spec).post(
        `/eservices/${eservice.id}/archive`,
      );

      expect(response.statusCode).toBe(403);
    },
  );
});
