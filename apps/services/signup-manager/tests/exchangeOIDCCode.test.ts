import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAxiosPost = vi.hoisted(() => vi.fn());
const mockJwtVerify = vi.hoisted(() => vi.fn());

vi.mock("axios", async (importOriginal) => {
  const original = await importOriginal<typeof import("axios")>();

  return {
    ...original,
    default: {
      ...original.default,
      post: mockAxiosPost,
    },
    post: mockAxiosPost,
  };
});
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "mock-jwks"),
  jwtVerify: mockJwtVerify,
}));

vi.mock("@knodia/token-generator", () => ({
  tokenGeneratorBuilder: () => ({
    generateUISignupSessionToken: vi.fn().mockResolvedValue({
      serialized: "mock-signup-session-token",
    }),
  }),
}));

import { OIDC_SESSION_COOKIE_NAME } from "../src/models/api.ts";
import { app } from "./setup.ts";

function expectOIDCSessionCookieCleared(response: {
  headers: { "set-cookie"?: string | string[] };
}) {
  const setCookieHeader = getSetCookieHeader(response);

  expect(setCookieHeader).toBeDefined();
  expect(setCookieHeader).toContain(`${OIDC_SESSION_COOKIE_NAME}=`);
  expect(setCookieHeader).toContain("Path=/");
  expect(setCookieHeader).toContain("HttpOnly");
  expect(setCookieHeader).toContain("SameSite=Strict");
  expect(setCookieHeader).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
}

function getSetCookieHeader(response: {
  headers: { "set-cookie"?: string | string[] };
}) {
  const rawSetCookieHeader = response.headers["set-cookie"];
  const setCookieHeaders = Array.isArray(rawSetCookieHeader)
    ? rawSetCookieHeader
    : rawSetCookieHeader
      ? [rawSetCookieHeader]
      : [];

  return setCookieHeaders.find((header) =>
    header.startsWith(`${OIDC_SESSION_COOKIE_NAME}=`),
  );
}

function setupSuccessfulTokenExchange(nonce: string) {
  mockAxiosPost.mockResolvedValueOnce({
    data: oneIdentityResponseMock,
  });

  mockJwtVerify.mockResolvedValueOnce({
    payload: {
      ...oneIdentityIdTokenClaimsMock,
      nonce,
    },
    protectedHeader: { alg: "RS256" },
  });
}

async function startOIDCSession() {
  const response = await app.inject({
    method: "GET",
    url: "/auth/oidc/start",
  });

  const setCookieHeader = response.headers["set-cookie"] as string;
  const startUrl = new URL(response.headers["location"] ?? "");
  const nonce = startUrl.searchParams.get("nonce");
  const state = startUrl.searchParams.get("state");
  const encodedCookie = setCookieHeader.split(";")[0]?.split("=")[1];

  if (!encodedCookie || !nonce || !state) {
    throw new Error("Invalid OIDC session start response");
  }

  return {
    cookie: decodeURIComponent(encodedCookie),
    nonce,
    state,
  };
}

const oneIdentityResponseMock = {
  access_token: "mock-access-token",
  expires_in: 3600,
  id_token: "mock.id.token",
  scope: "openid",
  token_type: "Bearer",
};

const oneIdentityIdTokenClaimsMock = {
  aud: "test-one-identity-client-id",
  dateOfBirth: "2000-01-01",
  exp: Math.floor(Date.now() / 1000) + 3600,
  familyName: "User",
  fiscalNumber: "XXXXXX00X00X000X",
  iat: Math.floor(Date.now() / 1000),
  iss: "https://test.one-identity.com",
  name: "Test User",
  nonce: "test-nonce",
  spidCode: "test-spid-code",
  sub: "user-123",
};

describe("GET /auth/oidc/token (exchangeOIDCCode)", () => {
  beforeEach(() => {
    mockAxiosPost.mockReset();
    mockJwtVerify.mockReset();
  });

  it("returns 200 with uiSignupSessionToken on successful code exchange", async () => {
    const { cookie, nonce, state } = await startOIDCSession();

    setupSuccessfulTokenExchange(nonce);

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: `/auth/oidc/token?code=auth-code-123&state=${state}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty("uiSignupSessionToken");
    expect(mockAxiosPost).toHaveBeenCalledOnce();
    expect(mockJwtVerify).toHaveBeenCalledOnce();
  });

  it('clears the "oidc-session" cookie on successful code exchange', async () => {
    const { cookie, nonce, state } = await startOIDCSession();

    setupSuccessfulTokenExchange(nonce);

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: `/auth/oidc/token?code=auth-code-123&state=${state}`,
    });

    expect(response.statusCode).toBe(200);
    expectOIDCSessionCookieCleared(response);
  });

  it("returns 400 when the authorization code is missing", async () => {
    const { cookie, state } = await startOIDCSession();

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: `/auth/oidc/token?state=${state}`,
    });

    expect(response.statusCode).toBe(400);
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it("returns 400 when the state is missing", async () => {
    const { cookie } = await startOIDCSession();

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: "/auth/oidc/token?code=auth-code-123",
    });

    expect(response.statusCode).toBe(400);
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it('returns 403 when the "oidc-session" cookie is missing', async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/oidc/token?code=auth-code-123&state=state",
    });

    expect(response.statusCode).toBe(403);
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it("returns 403 when the state does not match the OIDC session", async () => {
    const { cookie } = await startOIDCSession();

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: "/auth/oidc/token?code=auth-code-123&state=invalid-state",
    });

    expect(response.statusCode).toBe(403);
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it("returns 403 when ID token verification fails", async () => {
    const { cookie, state } = await startOIDCSession();

    mockAxiosPost.mockResolvedValueOnce({
      data: oneIdentityResponseMock,
    });
    mockJwtVerify.mockRejectedValueOnce(new Error("Invalid token"));

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: `/auth/oidc/token?code=auth-code-123&state=${state}`,
    });

    expect(response.statusCode).toBe(403);
    expect(mockAxiosPost).toHaveBeenCalledOnce();
    expect(mockJwtVerify).toHaveBeenCalledOnce();
  });

  it("returns 403 when ID token nonce does not match the OIDC session", async () => {
    const { cookie, state } = await startOIDCSession();

    mockAxiosPost.mockResolvedValueOnce({
      data: oneIdentityResponseMock,
    });
    mockJwtVerify.mockResolvedValueOnce({
      payload: {
        ...oneIdentityIdTokenClaimsMock,
        nonce: "invalid-nonce",
      },
      protectedHeader: { alg: "RS256" },
    });

    const response = await app.inject({
      cookies: {
        [OIDC_SESSION_COOKIE_NAME]: cookie,
      },
      method: "GET",
      url: `/auth/oidc/token?code=auth-code-123&state=${state}`,
    });

    expect(response.statusCode).toBe(403);
    expect(mockAxiosPost).toHaveBeenCalledOnce();
    expect(mockJwtVerify).toHaveBeenCalledOnce();
  });
});
