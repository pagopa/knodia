import type { UISessionTokenClaims } from "@knodia/common-models/auth";

import fastifyRequestContext from "@fastify/request-context";
import { requestContext } from "@fastify/request-context";
import {
  generateId,
  OrganizationId,
  unsafeBrandId,
  UserId,
} from "@knodia/common-models/ids";
import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  authenticationPlugin,
  parseAuthHeaderToken,
} from "../../src/auth/authentication.ts";
import { ApiError } from "../../src/models/errors/apiError.ts";
import { makeApiProblemBuilder } from "../../src/utils/problemBuilder.ts";

const { createRemoteJWKSet, jwtVerify } = vi.hoisted(() => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("mock-jwks-set"),
  jwtVerify: vi.fn(),
}));

vi.mock("jose", () => ({ createRemoteJWKSet, jwtVerify }));

const makeApiProblem = makeApiProblemBuilder({});

const buildTestApp = async (wellKnownUrls: string[]) => {
  const app = Fastify({ logger: false });

  await app.register(fastifyRequestContext, {
    defaultStoreValues: (request) => ({
      correlationId: generateId(),
      logger: request.log,
      serviceName: "backend-for-frontend" as const,
    }),
  });

  await app.register(authenticationPlugin, {
    acceptedAudiences: ["test-audience"],
    wellKnownUrls,
  });

  app.setErrorHandler((error, _, reply) => {
    const problem = makeApiProblem(error);
    return reply.status(problem.status).send(problem);
  });

  return app;
};

describe("parseAuthHeaderToken", () => {
  it("throws ApiError when header is undefined", () => {
    expect(() => parseAuthHeaderToken(undefined)).toThrow(ApiError);
  });

  it("throws ApiError when header does not start with 'Bearer '", () => {
    expect(() => parseAuthHeaderToken("Basic abc123")).toThrow(ApiError);
  });

  it("throws ApiError when header equals just 'Bearer' (no space/token)", () => {
    expect(() => parseAuthHeaderToken("Bearer")).toThrow(ApiError);
  });

  it("returns the token when header is a valid Bearer value", () => {
    expect(parseAuthHeaderToken("Bearer my-token-value")).toBe(
      "my-token-value",
    );
  });
});

describe("authenticationPlugin", () => {
  const userId: UserId = unsafeBrandId(crypto.randomUUID());
  const organizationId: OrganizationId = unsafeBrandId(crypto.randomUUID());

  const validPayload: UISessionTokenClaims = {
    aud: "test-audience",
    exp: 9999999999,
    iat: 0,
    iss: "test-issuer",
    jti: "test-jti",
    organizationId,
    roles: ["administrative"],
    sub: userId,
    type: "ui-session",
  };

  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp(["https://example.com/.well-known/jwks.json"]);

    app.get("/status", async () => ({ ok: true }));
    app.get("/docs/test", async () => ({ ok: true }));
    app.get("/protected", async () => ({
      authData: requestContext.get("authData"),
    }));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("bypasses auth for the /status route", async () => {
    const response = await app.inject({ method: "GET", url: "/status" });

    expect(response.statusCode).toBe(200);
  });

  it("bypasses auth for routes under the /docs prefix", async () => {
    const response = await app.inject({ method: "GET", url: "/docs/test" });

    expect(response.statusCode).toBe(200);
  });

  it("returns 401 when the Authorization header is missing", async () => {
    const response = await app.inject({ method: "GET", url: "/protected" });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 when the Authorization header is not a Bearer token", async () => {
    const response = await app.inject({
      headers: { authorization: "Basic abc123" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain("Missing or invalid Authorization header");
  });

  it("returns 401 when token verification fails on all JWKS sets", async () => {
    jwtVerify.mockRejectedValueOnce(new Error("invalid signature"));

    const response = await app.inject({
      headers: { authorization: "Bearer bad-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain("Token verification failed");
  });

  it("returns 401 when the verified payload does not match KnodiaTokenClaims", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: { sub: userId, tokenType: "unknown" },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer bad-claims-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain("Invalid token claims");
  });

  it("returns 401 when roles array is empty", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: { ...validPayload, roles: [] },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer empty-roles-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain("Invalid token claims");
  });

  it("returns 401 when roles array contains an invalid value", async () => {
    jwtVerify.mockResolvedValueOnce({
      payload: { ...validPayload, roles: ["admin"] },
    });

    const response = await app.inject({
      headers: { authorization: "Bearer invalid-role-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain("Invalid token claims");
  });

  it("sets authData in context when token is valid", async () => {
    jwtVerify.mockResolvedValueOnce({ payload: validPayload });

    const response = await app.inject({
      headers: { authorization: "Bearer valid-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      authData: {
        organizationId,
        tokenType: "ui-session",
        userId,
        userRoles: ["administrative"],
      },
    });
  });

  it("succeeds using the first valid JWKS when multiple are configured", async () => {
    const multiJwksApp = await buildTestApp([
      "https://primary.example.com/.well-known/jwks.json",
      "https://secondary.example.com/.well-known/jwks.json",
    ]);
    multiJwksApp.get("/protected", async () => ({
      authData: requestContext.get("authData"),
    }));
    await multiJwksApp.ready();

    // First JWKS fails, second succeeds
    jwtVerify
      .mockRejectedValueOnce(new Error("key not found"))
      .mockResolvedValueOnce({ payload: validPayload });

    const response = await multiJwksApp.inject({
      headers: { authorization: "Bearer fallback-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      authData: {
        organizationId,
        tokenType: "ui-session",
        userId,
        userRoles: ["administrative"],
      },
    });

    await multiJwksApp.close();
  });
});
