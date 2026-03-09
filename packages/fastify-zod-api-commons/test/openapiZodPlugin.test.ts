import type { OpenAPIV3 } from "openapi-types";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

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
