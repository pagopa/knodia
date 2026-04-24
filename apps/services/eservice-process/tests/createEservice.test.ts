/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { unsafeBrandExternalId } from "@knodia/common-models/externalResource";
import {
  type EserviceId,
  generateId,
  type OrganizationId,
} from "@knodia/common-models/ids";
import {
  type Eservice,
  EserviceEventV1,
  toEserviceV1,
} from "@knodia/eservice-models";
import { eserviceTemplates } from "@knodia/eservice-template-models";
import { METADATA_VERSION_HEADER } from "@knodia/fastify-zod-api-commons/models";
import {
  forbiddenTestTokens,
  TEST_ORGANIZATION_ID,
  type TestToken,
} from "@knodia/test-commons/auth";
import { createInjectAppRequest } from "@knodia/test-commons/fastify";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import { buildApp } from "../src/app.ts";
import {
  type API_Eservice,
  API_EserviceFromTemplateSeed,
  API_EserviceManualSeed,
} from "../src/models/api.ts";
import { toAPI_Eservice } from "../src/models/apiConverter.ts";
import { mockEservices } from "./mockEservices.ts";
import { eserviceWriterService, eventStoreDb, readmodelDb } from "./setup.ts";
import { getAllEserviceEvents, injectAppRequest } from "./utils.ts";

const validAttribute = { code: "nuts1", scheme: "vc_territorial_units" };
const validCategory = {
  code: "citizen.residence.residence_place",
  scheme: "vc_example_eservice_categories",
};

const allowedTestTokens: TestToken[] = [
  { roles: ["technical"], type: "ui-session" },
];

describe("POST /eservices (createEservice)", () => {
  const body = {
    ...zocker(API_EserviceManualSeed).setSeed(0).generate(),
    categories: [validCategory],
    maxDailyCallsPerConsumer: 1000,
    maxDailyCallsPerKnode: 2000,
    requiredAttributes: [[validAttribute]],
  };
  const templateSeed = eserviceTemplates.Lynx[0]!;
  const bodyFromTemplate = {
    ...zocker(API_EserviceFromTemplateSeed).setSeed(1).generate(),
    maxDailyCallsPerConsumer: 1000,
    maxDailyCallsPerKnode: 2000,
    template: {
      id: templateSeed.id,
      knodeId: "Lynx",
    } as const,
  };

  it("should correctly create eservice creation event", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body(body);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Eservice>();

    const expectedEservice: Eservice = {
      categories: body.categories ?? [],
      createdAt: new Date(responseBody.createdAt),
      description: body.description,
      id: responseBody.id as EserviceId,
      isConsumerOperatorIdentificationRequired: false,
      isSignalHubEnabled: body.isSignalHubEnabled ?? false,
      mode: body.mode ?? "ProvideData",
      name: body.name,
      producerId: TEST_ORGANIZATION_ID,
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

    expect({ ...responseBody, template: undefined }).toMatchObject(
      toAPI_Eservice(expectedEservice),
    );

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

  it("should correctly create eservice creation event from template", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body(bodyFromTemplate);

    expect(response.headers[METADATA_VERSION_HEADER]).toEqual("0");
    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Eservice>();

    const expectedEservice: Eservice = {
      categories: templateSeed.categories,
      createdAt: new Date(responseBody.createdAt),
      description: bodyFromTemplate.description,
      id: responseBody.id as EserviceId,
      isConsumerOperatorIdentificationRequired: false,
      isSignalHubEnabled: bodyFromTemplate.isSignalHubEnabled ?? false,
      mode: templateSeed.mode,
      name: bodyFromTemplate.name,
      producerId: TEST_ORGANIZATION_ID,
      template: {
        id: unsafeBrandExternalId(templateSeed.id),
        knodeId: bodyFromTemplate.template.knodeId,
      },
      updatedAt: new Date(responseBody.createdAt),
      versions: [
        {
          accessTokenAudience: bodyFromTemplate.accessTokenAudience,
          accessTokenDuration: bodyFromTemplate.accessTokenDuration ?? 3600,
          accessTokenType: bodyFromTemplate.accessTokenType ?? "Bearer",
          createdAt: new Date(responseBody.createdAt),
          id: expect.any(String),
          interfaceDocument: {
            checksum: bodyFromTemplate.interfaceDocument.checksum,
            contentType: bodyFromTemplate.interfaceDocument.contentType,
            createdAt: new Date(responseBody.createdAt),
            id: bodyFromTemplate.interfaceDocument.id,
            name: bodyFromTemplate.interfaceDocument.name,
            path: bodyFromTemplate.interfaceDocument.path,
            prettyName: bodyFromTemplate.interfaceDocument.prettyName,
            updatedAt: new Date(responseBody.createdAt),
          },
          maxDailyCallsPerConsumer: bodyFromTemplate.maxDailyCallsPerConsumer,
          maxDailyCallsPerKnode: bodyFromTemplate.maxDailyCallsPerKnode,
          requiredAttributes: templateSeed.requiredAttributes,
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
      const response = await injectAppRequest(allowedTestTokens[0]!)
        .post("/eservices")
        .body(body as never);
      expect(response.statusCode).toBe(400);
    },
  );

  it("should return 400 if an attribute is invalid", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body({
        ...body,
        requiredAttributes: [
          [{ code: "nonexistent", scheme: "vc_territorial_units" }],
        ],
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if the body mixes template creation with locked fields", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body({
        ...bodyFromTemplate,
        categories: [validCategory],
      });

    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if the maxDailyCallsPerConsumer is greater than maxDailyCallsPerKnode", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body({
        ...body,
        maxDailyCallsPerConsumer: 2000,
        maxDailyCallsPerKnode: 1000,
      });
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if a category is invalid", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body({
        ...body,
        categories: [
          { code: "nonexistent", scheme: "vc_example_eservice_categories" },
        ],
      });
    expect(response.statusCode).toBe(400);
  });

  it.each(forbiddenTestTokens(allowedTestTokens))(
    "should return 403 for unauthorized token ($type)",
    async (spec) => {
      const response = await injectAppRequest(spec)
        .post("/eservices")
        .body(body);
      expect(response.statusCode).toBe(403);
    },
  );

  it("should return 409 if an interface with the same ID already exists", async () => {
    await eserviceWriterService.upsertEservice(mockEservices[0]!, 0);

    const response = await injectAppRequest(allowedTestTokens[0]!)
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

  it("should return 404 if the template does not exist", async () => {
    const response = await injectAppRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body({
        ...bodyFromTemplate,
        template: {
          id: generateId(),
          knodeId: bodyFromTemplate.template.knodeId,
        },
      });

    expect(response.statusCode).toBe(404);
  });

  it("should return 403 if the organization does not exist", async () => {
    const response = await injectAppRequest({
      organizationId: generateId<OrganizationId>(),
      roles: ["technical"],
      type: "ui-session",
    })
      .post("/eservices")
      .body(body);
    expect(response.statusCode).toBe(403);
  });

  it("should set isConsumerOperatorIdentificationRequired from config", async () => {
    const appWithIdentificationRequired = buildApp({
      config: {
        acceptedAudiences: ["test-audience"],
        isConsumerOperatorIdentificationRequired: true,
        isProduction: false,
        logLevel: "silent",
        nodeEnv: "test",
        wellKnownUrls: ["https://test.example.com/.well-known/jwks.json"],
      },
      eventStoreDb,
      readmodelDb,
    });

    const injectRequest = createInjectAppRequest(
      () => appWithIdentificationRequired,
    );

    const response = await injectRequest(allowedTestTokens[0]!)
      .post("/eservices")
      .body(body);

    expect(response.statusCode).toBe(201);

    const responseBody = response.json<API_Eservice>();
    expect(responseBody.isConsumerOperatorIdentificationRequired).toBe(true);
  });
});
