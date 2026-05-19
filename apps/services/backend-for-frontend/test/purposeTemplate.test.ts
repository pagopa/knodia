import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "./setup.ts";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockDecodeJwt = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());
const getCurrentPurposeFormSchemasMock = vi.hoisted(() => vi.fn());

vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("mock-jwks"),
  decodeJwt: (...args: unknown[]) => mockDecodeJwt(...args),
  jwtVerify: mockJwtVerify,
}));

vi.mock("@aws-sdk/client-kms", () => ({
  KMSClient: function MockKMSClient() {
    return { send: mockKmsSend };
  },
  SignCommand: function MockSignCommand(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    return { ...input };
  },
}));

vi.mock("@knodia/remote-resources-manager-client", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/remote-resources-manager-client")
    >();

  return {
    ...original,
    remoteResourcesManagerApi: {
      ...original.remoteResourcesManagerApi,
      getCurrentPurposeFormSchemas: getCurrentPurposeFormSchemasMock,
    },
  };
});

const ORGANIZATION_ID = "20000000-2000-1000-8000-000000000002";
const USER_ID = "10000000-1000-1000-8000-000000000001";

const ORION_GENERIC_TEMPLATE_ID = "a1b2c3d4-0002-4000-8000-000000000001";
const ORION_ESERVICE_01_TEMPLATE_ID = "a1b2c3d4-0002-4000-8000-000000000002";
const ORION_ESERVICE_02_TEMPLATE_ID = "a1b2c3d4-0002-4000-8000-000000000003";
const ORION_BEARER_ESERVICE_ID = "e7f5837e-75f4-431d-9465-73366d27bef2";
const ORION_DPOP_ESERVICE_ID = "905c4569-95db-4670-a146-8239fcb3f41a";

const CURRENT_MAJOR = 1;
const CURRENT_FORM_SCHEMA_VERSION = `${CURRENT_MAJOR}.0`;
const NEXT_FORM_SCHEMA_VERSION = `${CURRENT_MAJOR + 1}.0`;

const currentFormSchemasResponse = {
  data: {
    schema: { properties: {}, type: "object" },
    texts: { en: {} },
    uiSchema: { elements: [], type: "VerticalLayout" },
    uiTexts: { en: {} },
    version: CURRENT_FORM_SCHEMA_VERSION,
  },
};

function makeUiSessionPayload(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    aud: "test-audience",
    exp: Math.floor(Date.now() / 1000) + 300,
    iat: Math.floor(Date.now() / 1000),
    iss: "test-issuer",
    jti: crypto.randomUUID(),
    organizationId: ORGANIZATION_ID,
    roles: ["administrative"],
    sub: USER_ID,
    type: "ui-session",
    username: "test-user",
    ...overrides,
  };
}

describe("GET /purposeTemplates (getPurposeTemplates)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeUiSessionPayload(),
      protectedHeader: { alg: "RS256" },
    });
    getCurrentPurposeFormSchemasMock.mockResolvedValue(
      currentFormSchemasResponse,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with all Orion templates when no eserviceId is given", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: "/purposeTemplates?knodeId=Orion",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { eserviceId?: string; id: string }[];
    expect(body.map((t) => t.id).sort()).toEqual(
      [
        ORION_GENERIC_TEMPLATE_ID,
        ORION_ESERVICE_01_TEMPLATE_ID,
        ORION_ESERVICE_02_TEMPLATE_ID,
      ].sort(),
    );
    const byId = Object.fromEntries(body.map((t) => [t.id, t]));
    expect(byId[ORION_GENERIC_TEMPLATE_ID]?.eserviceId).toBeUndefined();
    expect(byId[ORION_ESERVICE_01_TEMPLATE_ID]?.eserviceId).toBe(
      ORION_BEARER_ESERVICE_ID,
    );
    expect(byId[ORION_ESERVICE_02_TEMPLATE_ID]?.eserviceId).toBe(
      ORION_DPOP_ESERVICE_ID,
    );
  });

  it("returns 200 with generic + matching templates when eserviceId is given", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: `/purposeTemplates?knodeId=Orion&eserviceId=${ORION_BEARER_ESERVICE_ID}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { eserviceId?: string; id: string }[];
    expect(body.map((t) => t.id).sort()).toEqual(
      [ORION_GENERIC_TEMPLATE_ID, ORION_ESERVICE_01_TEMPLATE_ID].sort(),
    );
    const byId = Object.fromEntries(body.map((t) => [t.id, t]));
    expect(byId[ORION_GENERIC_TEMPLATE_ID]?.eserviceId).toBeUndefined();
    expect(byId[ORION_ESERVICE_01_TEMPLATE_ID]?.eserviceId).toBe(
      ORION_BEARER_ESERVICE_ID,
    );
  });

  it("returns 200 with empty list when current form schema version does not match any template", async () => {
    getCurrentPurposeFormSchemasMock.mockResolvedValueOnce({
      data: {
        ...currentFormSchemasResponse.data,
        version: NEXT_FORM_SCHEMA_VERSION,
      },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: "/purposeTemplates?knodeId=Orion",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("returns 400 when knodeId is missing", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: "/purposeTemplates",
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when eserviceId is not a UUID", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: "/purposeTemplates?knodeId=Orion&eserviceId=not-a-uuid",
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 200 when the user has a technical role", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeUiSessionPayload({ roles: ["technical"] }),
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer technical.ui.session" },
      method: "GET",
      url: "/purposeTemplates?knodeId=Orion",
    });

    expect(response.statusCode).toBe(200);
  });
});

describe("GET /purposeTemplates/:purposeTemplateId (getPurposeTemplate)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeUiSessionPayload(),
      protectedHeader: { alg: "RS256" },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with the template details on the happy path", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: `/purposeTemplates/${ORION_GENERIC_TEMPLATE_ID}?knodeId=Orion`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      formAnswersJson: Record<string, unknown>;
      formSchemaVersion: string;
      id: string;
    };
    expect(body.id).toBe(ORION_GENERIC_TEMPLATE_ID);
    expect(body.formSchemaVersion).toBe(CURRENT_FORM_SCHEMA_VERSION);
    expect(typeof body.formAnswersJson).toBe("object");
  });

  it("returns 404 when the template id does not belong to the given Knode", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: `/purposeTemplates/${ORION_GENERIC_TEMPLATE_ID}?knodeId=Lynx`,
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 404 when the template id is unknown", async () => {
    const unknownId = "00000000-0000-4000-8000-000000000000";
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: `/purposeTemplates/${unknownId}?knodeId=Orion`,
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns 400 when the template id path param is not a UUID", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      url: "/purposeTemplates/not-a-uuid?knodeId=Orion",
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 200 when the user has a technical role", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: makeUiSessionPayload({ roles: ["technical"] }),
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer technical.ui.session" },
      method: "GET",
      url: `/purposeTemplates/${ORION_GENERIC_TEMPLATE_ID}?knodeId=Orion`,
    });

    expect(response.statusCode).toBe(200);
  });
});
