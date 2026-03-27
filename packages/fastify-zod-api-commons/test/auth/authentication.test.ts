import type { FastifyInstance } from "fastify";

import { requestContext } from "@fastify/request-context";
import {
  getTestInternalTokenClaims,
  getTestUISessionTokenClaims,
} from "@knodia/test-commons/auth";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  authenticationPlugin,
  parseAuthHeaderToken,
} from "../../src/auth/authentication.ts";
import { ApiError } from "../../src/models/errors/apiError.ts";
import { healthRouterUrl } from "../../src/routers/healthRouter.ts";
import { docsRoutePrefix } from "../../src/utils/openapi-zod-plugin/openapiZodPlugin.ts";
import { buildTestApp } from "../mock/buildTestApp.ts";

const { createRemoteJWKSet, jwtVerify } = vi.hoisted(() => ({
  createRemoteJWKSet: vi.fn().mockReturnValue("mock-jwks-set"),
  jwtVerify: vi.fn(),
}));

vi.mock("jose", () => ({ createRemoteJWKSet, jwtVerify }));

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

  it("returns the token when header is a valid Bearer value, case-insensitive", () => {
    expect(parseAuthHeaderToken("Bearer my-token-value")).toBe(
      "my-token-value",
    );

    expect(parseAuthHeaderToken("bearer my-token-value")).toBe(
      "my-token-value",
    );

    expect(parseAuthHeaderToken("BEARER my-token-value")).toBe(
      "my-token-value",
    );
  });
});

const validUISessionPayload = getTestUISessionTokenClaims();
const validInternalPayload = getTestInternalTokenClaims();

const docsTestRoute = `${docsRoutePrefix}/test`;

describe("authenticationPlugin", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildTestApp();

    // Public routes (no auth) — registered outside the protected context
    app.get(healthRouterUrl, async () => ({ ok: true }));
    app.get(docsTestRoute, async () => ({ ok: true }));

    // Protected routes — authenticationPlugin scoped via Fastify encapsulation
    app.register(async (protectedApp) => {
      protectedApp.register(authenticationPlugin, {
        acceptedAudiences: ["test-audience"],
        wellKnownUrls: ["https://example.com/.well-known/jwks.json"],
      });
      protectedApp.get("/protected", async () => ({
        authData: requestContext.get("authData"),
      }));
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("encapsulation", () => {
    it("does not require auth for the health status route", async () => {
      const response = await app.inject({
        method: "GET",
        url: healthRouterUrl,
      });

      expect(response.statusCode).toBe(200);
    });

    it("does not require auth for routes under the /docs prefix", async () => {
      const response = await app.inject({
        method: "GET",
        url: docsTestRoute,
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("rejection", () => {
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
      expect(response.body).toContain(
        "Missing or invalid Authorization header",
      );
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

    it("returns 401 when the verified payload does not match KnodiaAuthTokenClaims", async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { sub: "some-user", tokenType: "unknown" },
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
        payload: { ...validUISessionPayload, roles: [] },
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
        payload: { ...validUISessionPayload, roles: ["invalid-role"] },
      });

      const response = await app.inject({
        headers: { authorization: "Bearer invalid-role-token" },
        method: "GET",
        url: "/protected",
      });

      expect(response.statusCode).toBe(401);
      expect(response.body).toContain("Invalid token claims");
    });
  });

  describe("valid tokens", () => {
    it("sets authData in context when ui-session token is valid", async () => {
      jwtVerify.mockResolvedValueOnce({ payload: validUISessionPayload });

      const response = await app.inject({
        headers: { authorization: "Bearer valid-token" },
        method: "GET",
        url: "/protected",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        authData: {
          organizationId: validUISessionPayload.organizationId,
          tokenType: validUISessionPayload.type,
          userId: validUISessionPayload.sub,
          userRoles: ["administrative"],
        },
      });
    });

    it("sets authData in context when internal token is valid", async () => {
      jwtVerify.mockResolvedValueOnce({ payload: validInternalPayload });

      const response = await app.inject({
        headers: { authorization: "Bearer internal-token" },
        method: "GET",
        url: "/protected",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        authData: {
          tokenType: validInternalPayload.type,
        },
      });
    });
  });
});

describe("authenticationPlugin with multiple JWKS", () => {
  let multiJwksApp: FastifyInstance;

  beforeAll(async () => {
    multiJwksApp = buildTestApp();
    multiJwksApp.register(async (protectedApp) => {
      protectedApp.register(authenticationPlugin, {
        acceptedAudiences: ["test-audience"],
        wellKnownUrls: [
          "https://primary.example.com/.well-known/jwks.json",
          "https://secondary.example.com/.well-known/jwks.json",
        ],
      });
      protectedApp.get("/protected", async () => ({
        authData: requestContext.get("authData"),
      }));
    });
    await multiJwksApp.ready();
  });

  afterAll(async () => {
    await multiJwksApp.close();
  });

  it("succeeds using the first valid JWKS when multiple are configured", async () => {
    jwtVerify
      .mockRejectedValueOnce(new Error("key not found"))
      .mockResolvedValueOnce({ payload: validUISessionPayload });

    const response = await multiJwksApp.inject({
      headers: { authorization: "Bearer fallback-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      authData: {
        organizationId: validUISessionPayload.organizationId,
        tokenType: validUISessionPayload.type,
        userId: validUISessionPayload.sub,
        userRoles: ["administrative"],
      },
    });
  });

  it("returns 401 when all JWKS sets fail", async () => {
    jwtVerify
      .mockRejectedValueOnce(new Error("key not found"))
      .mockRejectedValueOnce(new Error("invalid signature"));

    const response = await multiJwksApp.inject({
      headers: { authorization: "Bearer bad-token" },
      method: "GET",
      url: "/protected",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toContain("Token verification failed");
  });

  it("validates against all JWKS sets in parallel", async () => {
    jwtVerify.mockClear();
    jwtVerify
      .mockRejectedValueOnce(new Error("key not found"))
      .mockResolvedValueOnce({ payload: validUISessionPayload });

    await multiJwksApp.inject({
      headers: { authorization: "Bearer token" },
      method: "GET",
      url: "/protected",
    });

    expect(jwtVerify).toHaveBeenCalledTimes(2);
  });
});
