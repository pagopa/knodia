/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import { generateId, type OrganizationId } from "@knodia/common-models/ids";
import {
  EserviceEventV1,
  EserviceVersionState,
  fromEserviceV1,
} from "@knodia/eservice-models";
import { getEserviceTemplates } from "@knodia/eservice-template-models";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import { forbiddenTestTokens, type TestToken } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import type { API_FlatEservice } from "../src/models/api.ts";

import { toAPI_FlatEservice } from "../src/models/apiConverter.ts";
import {
  getAllEserviceEvents,
  injectAppRequest,
  makeEserviceWithVersionState,
  seedEservice,
} from "./utils.ts";

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
  { roles: ["technical"], type: "ui-session" },
];

const validCategory = {
  code: "citizen.residence.residence_place",
  scheme: "vc_example_eservice_categories",
};

describe("PATCH /eservices/:eserviceId (updateEservice)", () => {
  it("should update name, description and categories", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      200,
    );
    await seedEservice(eservice);

    const body = {
      categories: [validCategory],
      description: { en: "Updated description" },
      name: { en: "Updated name" },
    };

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body(body);

    expect(response.statusCode).toBe(200);
    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("1");

    const responseBody = response.json<API_FlatEservice>();
    expect(responseBody.name).toEqual(body.name);
    expect(responseBody.description).toEqual(body.description);
    expect(responseBody.categories).toEqual(body.categories);

    const events = await getAllEserviceEvents();
    expect(events).toHaveLength(2);

    const updateEvent = events[1];
    expect(updateEvent).toMatchObject({
      streamId: eservice.id,
      type: "EserviceUpdatedV1",
      version: 1,
    });

    const eventData = EserviceEventV1.parse(updateEvent).data;
    const eserviceFromEvent = fromEserviceV1(eventData.eservice!);
    expect(eserviceFromEvent.name).toEqual(body.name);
    expect(eserviceFromEvent.description).toEqual(body.description);
    expect(eserviceFromEvent.categories).toEqual(body.categories);
  });

  it("should update only name when only name is provided", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      201,
    );
    await seedEservice(eservice);

    const body = { name: { en: "Only name updated" } };

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body(body);

    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_FlatEservice>();
    expect(responseBody.name).toEqual(body.name);
    expect(responseBody.description).toEqual(
      toAPI_FlatEservice(eservice).description,
    );
    expect(responseBody.categories).toEqual(
      toAPI_FlatEservice(eservice).categories,
    );
  });

  it("should update only description when only description is provided", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      202,
    );
    await seedEservice(eservice);

    const body = { description: { en: "Only description updated" } };

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body(body);

    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_FlatEservice>();
    expect(responseBody.description).toEqual(body.description);
    expect(responseBody.name).toEqual(toAPI_FlatEservice(eservice).name);
  });

  it("should update only categories when only categories is provided", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      203,
    );
    await seedEservice(eservice);

    const body = { categories: [validCategory] };

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body(body);

    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_FlatEservice>();
    expect(responseBody.categories).toEqual(body.categories);
    expect(responseBody.name).toEqual(toAPI_FlatEservice(eservice).name);
  });

  it("should accept an empty body and still emit an event", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      204,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body({});

    expect(response.statusCode).toBe(200);

    const responseBody = response.json<API_FlatEservice>();
    expect(responseBody.name).toEqual(toAPI_FlatEservice(eservice).name);
    expect(responseBody.description).toEqual(
      toAPI_FlatEservice(eservice).description,
    );

    const events = await getAllEserviceEvents();
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({ type: "EserviceUpdatedV1" });
  });
});

describe("PATCH /eservices/:eserviceId (updateEservice) - error cases", () => {
  it("should return 400 if body has unknown properties", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      205,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body({ name: { en: "Valid name" }, unknownField: "bad" } as never);

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if a category is invalid", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      206,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body({
        categories: [
          { code: "nonexistent", scheme: "vc_example_eservice_categories" },
        ],
      });

    expect(response.statusCode).toBe(400);
  });

  it("should return 409 if categories are updated on an E-service template instance", async () => {
    const template = getEserviceTemplates("Lynx")[0]!;
    const eservice = {
      ...makeEserviceWithVersionState(EserviceVersionState.enum.Active, 210),
      categories: template.eserviceFields.categories,
      mode: template.eserviceFields.mode,
      template: {
        id: unsafeBrandExternalId(template.id),
        knodeId: "Lynx",
      } as const,
    };
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body({ categories: [validCategory] });

    expect(response.statusCode).toBe(409);
  });

  it("should return 403 if caller is not the producer", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      207,
      generateId<OrganizationId>(),
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${eservice.id}`)
      .body({ name: { en: "Updated name" } });

    expect(response.statusCode).toBe(403);
  });

  it("should return 404 if e-service does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .patch(`/eservices/${generateId()}`)
      .body({ name: { en: "Updated name" } });

    expect(response.statusCode).toBe(404);
  });

  it("should allow technical role to update", async () => {
    const eservice = makeEserviceWithVersionState(
      EserviceVersionState.enum.Active,
      208,
    );
    await seedEservice(eservice);

    const response = await injectAppRequest(allowedTestTokens[1]!)
      .patch(`/eservices/${eservice.id}`)
      .body({ name: { en: "Technical update" } });

    expect(response.statusCode).toBe(200);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const eservice = makeEserviceWithVersionState(
        EserviceVersionState.enum.Active,
        209,
      );
      await seedEservice(eservice);

      const response = await injectAppRequest(spec)
        .patch(`/eservices/${eservice.id}`)
        .body({ name: { en: "Unauthorized update" } });

      expect(response.statusCode).toBe(403);
    },
  );
});
