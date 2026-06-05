import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { OpenAPIV3 } from "openapi-types";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import z from "zod";

import { healthRouter, healthRouterTag } from "../src/routers/healthRouter.ts";
import {
  bearerAuthSecurity,
  bearerAuthSecurityScheme,
} from "../src/utils/openapi-zod-plugin/security.ts";
import { buildTestApp } from "./mock/buildTestApp.ts";
import {
  expectedOpenapiComponents,
  expectedOpenapiPaths,
} from "./utils/expectedTestOpenapi.ts";
import { testRouter, testTags } from "./utils/testRouter.ts";

describe("openapiZodPlugin", () => {
  const fastify = buildTestApp({
    openapi: {
      components: { securitySchemes: bearerAuthSecurityScheme },
      info: {
        description: "API for testing openapiZodPlugin",
        title: "Test API",
        version: "1.0.0",
      },
      security: bearerAuthSecurity,
      servers: [{ description: "Test API server", url: "/" }],
      tags: [
        healthRouterTag,
        {
          description: "Tag 1 for testing",
          name: testTags.test,
        },
      ],
    },
  });

  beforeAll(async () => {
    await fastify.register(healthRouter);
    await fastify.register(testRouter);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("exposes an OpenAPI 3.0.4 spec for registered routes", () => {
    const openapi = fastify.swagger() as OpenAPIV3.Document;
    expect(openapi).toEqual({
      components: expectedOpenapiComponents,
      info: {
        contact: {
          url: "https://github.com/pagopa/knodia/issues",
        },
        description: "API for testing openapiZodPlugin",
        termsOfService: "https://knodia.org/",
        title: "Test API",
        version: "1.0.0",
      },
      openapi: "3.0.4",
      paths: expectedOpenapiPaths,
      security: [{ bearerAuth: [] }],
      servers: [
        {
          description: "Test API server",
          url: "/",
        },
      ],
      tags: [
        {
          description: healthRouterTag.description,
          name: healthRouterTag.name,
        },
        {
          description: "Tag 1 for testing",
          name: testTags.test,
        },
      ],
    });
  });

  it("exposes the OpenAPI spec in YAML format", () => {
    const openapiYaml = fastify.swagger({ yaml: true }) as string;
    expect(openapiYaml).toContain("openapi: 3.0.4");
    expect(openapiYaml).toContain("title: Test API");
    expect(openapiYaml).toContain("version: 1.0.0");
    expect(openapiYaml).toContain("/test");
  });
});

describe("summary enforcement", () => {
  const buildAppWithRoute = (
    schema: Record<string, unknown>,
    url: string,
  ): ReturnType<typeof buildTestApp> => {
    const router: FastifyPluginAsyncZod = async (app) => {
      app.route({
        handler: (_req, res) => {
          res.send({ test: "ok" });
        },
        method: "GET",
        schema: {
          operationId: "summaryEnforcementTest",
          response: { 200: z.strictObject({ test: z.string() }) },
          ...schema,
        },
        url,
      });
    };

    const fastify = buildTestApp();
    void fastify.register(router);
    return fastify;
  };

  it("throws when a route is missing a summary", async () => {
    const fastify = buildAppWithRoute({}, "/no-summary");
    await fastify.ready();
    expect(() => fastify.swagger()).toThrow(
      "Missing summary in schema for route GET /no-summary.",
    );
    await fastify.close();
  });

  it("passes when a route declares a summary", async () => {
    const fastify = buildAppWithRoute(
      { description: "Has a description", summary: "Has a summary" },
      "/with-summary",
    );
    await fastify.ready();
    expect(() => fastify.swagger()).not.toThrow();
    await fastify.close();
  });

  it("exempts /docs/* routes from the summary check", async () => {
    const fastify = buildAppWithRoute({}, "/docs/no-summary");
    await fastify.ready();
    expect(() => fastify.swagger()).not.toThrow();
    await fastify.close();
  });
});

describe("description enforcement", () => {
  const buildAppWithRoute = (
    schema: Record<string, unknown>,
    url: string,
  ): ReturnType<typeof buildTestApp> => {
    const router: FastifyPluginAsyncZod = async (app) => {
      app.route({
        handler: (_req, res) => {
          res.send({ test: "ok" });
        },
        method: "GET",
        schema: {
          operationId: "descriptionEnforcementTest",
          response: { 200: z.strictObject({ test: z.string() }) },
          // summary present so the description check is the one under test
          summary: "Description enforcement test",
          ...schema,
        },
        url,
      });
    };

    const fastify = buildTestApp();
    void fastify.register(router);
    return fastify;
  };

  it("throws when a route is missing a description", async () => {
    const fastify = buildAppWithRoute({}, "/no-description");
    await fastify.ready();
    expect(() => fastify.swagger()).toThrow(
      "Missing description in schema for route GET /no-description.",
    );
    await fastify.close();
  });

  it("passes when a route declares a description", async () => {
    const fastify = buildAppWithRoute(
      { description: "Has a description" },
      "/with-description",
    );
    await fastify.ready();
    expect(() => fastify.swagger()).not.toThrow();
    await fastify.close();
  });

  it("exempts /docs/* routes from the description check", async () => {
    const fastify = buildAppWithRoute({}, "/docs/no-description");
    await fastify.ready();
    expect(() => fastify.swagger()).not.toThrow();
    await fastify.close();
  });
});
