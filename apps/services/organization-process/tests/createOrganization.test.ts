/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { OrganizationId } from "@knodia/common-models/ids";
import type { Organization } from "@knodia/organization-models";
import type { TestToken } from "@knodia/test-commons/auth";

import {
  OrganizationEventV1,
  toOrganizationV1,
} from "@knodia/organization-models";
import { forbiddenTestTokens } from "@knodia/test-commons/auth";
import { describe, expect, it } from "vitest";

import { API_Organization, API_OrganizationSeed } from "../src/models/api.ts";
import { toAPI_Organization } from "../src/models/apiConverter.ts";
import { getAllOrganizationEvents, injectAppRequest } from "./utils.ts";

const validAttribute = { code: "nuts1", scheme: "vc_territorial_units" };

const allowedTestTokens: TestToken[] = [
  { roles: ["administrative"], type: "ui-session" },
];

describe("POST /organizations (createOrganization)", () => {
  const body: API_OrganizationSeed = {
    attributes: [validAttribute],
    name: "Test Organization",
  };

  it("should correctly create organization creation event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/organizations")
      .body(body);
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Organization>();

    const expectedOrganization: Organization = {
      attributes: body.attributes,
      createdAt: new Date(responseBody.createdAt),
      id: responseBody.id as OrganizationId,
      name: body.name,
      updatedAt: new Date(responseBody.createdAt),
    };

    expect(responseBody).toMatchObject(
      toAPI_Organization(expectedOrganization),
    );

    const events = await getAllOrganizationEvents();
    expect(events).toHaveLength(1);

    const createdEvent = events[0];

    expect(createdEvent).toMatchObject({
      streamId: responseBody.id,
      type: "OrganizationCreatedV1",
      version: 0,
    });

    const createdEventData = OrganizationEventV1.parse(createdEvent).data;
    expect(createdEventData.organization).toMatchObject(
      toOrganizationV1(expectedOrganization),
    );
  });

  it("should create organization with empty attributes", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/organizations")
      .body({ ...body, attributes: [] });
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Organization>();
    expect(responseBody.attributes).toEqual([]);
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["name is a number", { ...body, name: 99 }],
    ["name is empty", { ...body, name: "" }],
    [
      "name is valid but has invalid property",
      { ...body, name: "Test Organization", wrongProperty: "wrong" },
    ],
    ["empty body", {}],
    ["missing name", { attributes: [validAttribute] }],
    ["missing attributes", { name: "Test" }],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, invalidBody) => {
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/organizations")
        .body(invalidBody as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if an attribute does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/organizations")
      .body({
        ...body,
        attributes: [{ code: "nonexistent", scheme: "nonexistent" }],
      });
    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/organizations")
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );
});
