/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { EserviceId } from "@knodia/common-models/ids";

import {
  Eservice,
  EserviceEventV1,
  toEserviceV1,
} from "@knodia/eservice-models";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import { API_Eservice, API_EserviceSeed } from "../src/models/api.ts";
import { toAPI_Eservice } from "../src/models/apiConverter.ts";
import { mockEservices } from "./mockEservices.ts";
import { eserviceWriterService } from "./setup.ts";
import { getAllEserviceEvents, injectAppRequest } from "./utils.ts";

const validAttribute = { code: "nuts1", scheme: "vc_territorial_units" };
const validCategory = {
  code: "citizen.residence.residence_place",
  scheme: "vc_example_eservice_categories",
};

describe("POST /eservices (createEservice)", () => {
  const body = {
    ...zocker(API_EserviceSeed).setSeed(0).generate(),
    categories: [validCategory],
    maxDailyCallsPerConsumer: 1000,
    maxDailyCallsPerKnode: 2000,
    requiredAttributes: [[validAttribute]],
  };

  it("should correctly create eservice creation event", async () => {
    const response = await injectAppRequest().post("/eservices").body(body);
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Eservice>();

    const expectedEservice: Eservice = {
      categories: body.categories ?? [],
      createdAt: new Date(responseBody.createdAt),
      description: body.description,
      id: responseBody.id as EserviceId,
      isConsumerOperatorIdentificationRequired:
        body.isConsumerOperatorIdentificationRequired ?? false,
      isSignalHubEnabled: body.isSignalHubEnabled ?? false,
      mode: body.mode ?? "ProvideData",
      name: body.name,
      producerId: expect.any(String), // TODO: It's random for now
      updatedAt: new Date(responseBody.createdAt),
      versions: [
        {
          accessTokenAudience: body.accessTokenAudience,
          accessTokenDuration: body.accessTokenDuration ?? 3600,
          accessTokenType: body.accessTokenType ?? "Bearer",
          createdAt: new Date(responseBody.createdAt),
          id: expect.any(String),
          interfaceDocument: {
            checksum: body.interfaceDocument.checksum,
            contentType: body.interfaceDocument.contentType,
            createdAt: new Date(responseBody.createdAt),
            id: body.interfaceDocument.id,
            name: body.interfaceDocument.name,
            path: body.interfaceDocument.path,
            prettyName: body.interfaceDocument.prettyName,
            updatedAt: new Date(responseBody.createdAt),
          },
          maxDailyCallsPerConsumer: body.maxDailyCallsPerConsumer,
          maxDailyCallsPerKnode: body.maxDailyCallsPerKnode,
          requiredAttributes: body.requiredAttributes,
          state: "Active",
          updatedAt: new Date(responseBody.createdAt),
          versionNumber: 1,
        },
      ],
    };

    expect(responseBody).toMatchObject(toAPI_Eservice(expectedEservice));

    const events = await getAllEserviceEvents();
    expect(events).toHaveLength(1);

    const createdEvent = events[0];

    expect(createdEvent).toMatchObject({
      streamId: responseBody.id,
      type: "EserviceVersionActivatedV1",
      version: 0,
    });

    const createdEventData = EserviceEventV1.parse(createdEvent).data;
    expect(createdEventData.eservice).toMatchObject(
      toEserviceV1(expectedEservice),
    );
  });

  it.each([
    ["invalid property", { ...body, wrongProperty: "wrong" }],
    ["name is a number", { ...body, name: 99 }],
    ["name is empty", { ...body, name: "" }],
    [
      "name is valid but has invalid property",
      { ...body, name: "Test E-service", wrongProperty: "wrong" },
    ],
    ["empty body", {}],
  ])(
    "should return 400 if the body is not correctly formatted - %s",
    async (_label, body) => {
      const response = await injectAppRequest()
        .post("/eservices")
        .body(body as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if an attribute is invalid", async () => {
    const response = await injectAppRequest()
      .post("/eservices")
      .body({
        ...body,
        requiredAttributes: [
          [{ code: "nonexistent", scheme: "vc_territorial_units" }],
        ],
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if the maxDailyCallsPerConsumer is greater than maxDailyCallsPerKnode", async () => {
    const response = await injectAppRequest()
      .post("/eservices")
      .body({
        ...body,
        maxDailyCallsPerConsumer: 2000,
        maxDailyCallsPerKnode: 1000,
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if a category is invalid", async () => {
    const response = await injectAppRequest()
      .post("/eservices")
      .body({
        ...body,
        categories: [
          { code: "nonexistent", scheme: "vc_example_eservice_categories" },
        ],
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 409 if an interface with the same ID already exists", async () => {
    await eserviceWriterService.upsertEservice(mockEservices[0]!, 0);

    const response = await injectAppRequest()
      .post("/eservices")
      .body({
        ...body,
        interfaceDocument: {
          ...body.interfaceDocument,
          id: mockEservices[0]!.versions[0]!.interfaceDocument.id,
        },
      });
    expect(response.statusCode).toBe(409);
  });
});
