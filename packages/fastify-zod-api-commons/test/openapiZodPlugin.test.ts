import type { OpenAPIV3_1 } from "openapi-types";

import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { healthRouter, healthRouterTag } from "../src/routers/healthRouter.ts";
import openapiZodPlugin from "../src/utils/openapi-zod-plugin/openapiZodPlugin.ts";
import {
  expectedOpenApiComponents,
  expectedStatusGet,
  expectedTestGet,
  expectedTestPost,
} from "./utils/expectedTestOpenapi.ts";
import { testRouter, testTags } from "./utils/testRouter.ts";

describe("openapiZodPlugin", () => {
  const fastify = Fastify({
    logger: false,
  });

  beforeAll(async () => {
    await fastify.register(openapiZodPlugin, {
      openapi: {
        info: {
          description: "API for testing openapiZodPlugin",
          title: "Test API",
          version: "1.0.0",
        },
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

    await fastify.register(healthRouter);
    await fastify.register(testRouter);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it("exposes an OpenAPI 3.0.4 spec for registered routes", () => {
    const openapi = fastify.swagger() as OpenAPIV3_1.Document;
    expect(openapi).toEqual({
      components: expectedOpenApiComponents,
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
      paths: {
        "/status": expectedStatusGet,
        "/test": {
          get: expectedTestGet,
          post: expectedTestPost,
        },
      },
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
});
