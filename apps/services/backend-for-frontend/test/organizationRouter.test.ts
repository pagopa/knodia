import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockJwtVerify = vi.hoisted(() => vi.fn());
const mockDecodeJwt = vi.hoisted(() => vi.fn());
const mockKmsSend = vi.hoisted(() => vi.fn());
const getOrganizationsMock = vi.hoisted(() => vi.fn());

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
      getOrganizations: getOrganizationsMock,
    },
  };
});

import { app } from "./setup.ts";

const USER_ID = "10000000-1000-1000-8000-000000000001";
const ORG_ID = "20000000-2000-1000-8000-000000000002";

const mockOrganizationsResponse = {
  data: {
    pagination: { limit: 50, offset: 0, total: 1 },
    results: [
      {
        attributes: [{ code: "Vega ABC Org", scheme: "Lynx" }],
        id: "30000000-3000-1000-8000-000000000003",
        knodeId: "Lynx",
        name: "Vega ABC Org",
      },
    ],
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
    organizationId: ORG_ID,
    roles: ["technical"],
    sub: USER_ID,
    type: "ui-session",
    username: "test-user",
    ...overrides,
  };
}

describe("GET /organizations (getOrganizations)", () => {
  beforeEach(() => {
    mockJwtVerify.mockResolvedValue({
      payload: makeUiSessionPayload(),
      protectedHeader: { alg: "RS256" },
    });
    getOrganizationsMock.mockResolvedValue(mockOrganizationsResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 forwarding the listing from RRM and propagates knodeId + name", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      query: { knodeId: "Lynx", limit: "50", name: "veg", offset: "0" },
      url: "/organizations",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(mockOrganizationsResponse.data);
    expect(getOrganizationsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ knodeId: "Lynx", name: "veg" }),
      }),
    );
  });

  it("returns 400 when the query is missing knodeId", async () => {
    const response = await app.inject({
      headers: { authorization: "Bearer valid.ui.session" },
      method: "GET",
      query: { limit: "50", name: "veg", offset: "0" },
      url: "/organizations",
    });

    expect(response.statusCode).toBe(400);
    expect(getOrganizationsMock).not.toHaveBeenCalled();
  });
});
