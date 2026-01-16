import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { OpenAPIV3_1 } from "openapi-types";

import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  API_Pagination,
  API_PaginationQueryParams,
} from "../src/models/api.ts";
import openapiZodPlugin from "../src/utils/openapiZodPlugin.ts";

describe("openapiZodPlugin", () => {
  const fastify = Fastify({
    logger: false,
  });

  const testRoute: FastifyPluginAsyncZod = async (fastify) => {
    fastify.route({
      handler: (req, res) => {
        res.send({
          limit: req.query.limit,
          offset: req.query.offset,
          results: ["test1", "test2"],
          total: 2,
        });
      },
      method: "GET",
      schema: {
        querystring: z
          .strictObject({
            query: z.string().describe("A string filter"),
          })
          .and(API_PaginationQueryParams),
        response: {
          200: z
            .strictObject({
              results: z.array(z.string()).describe("The response results"),
            })
            .and(API_Pagination)
            .describe("Results retrieved successfully"),
        },
      },
      url: "/test",
    });
  };

  beforeAll(async () => {
    await fastify.register(openapiZodPlugin, {
      openapi: {
        info: {
          description: "API for testing openapiZodPlugin",
          title: "Test API",
          version: "1.0.0",
        },
      },
      openapiDocs: false,
    });

    await fastify.register(testRoute);
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  const expectedPaginationSchema = {
    additionalProperties: false,
    properties: {
      limit: {
        format: "int32",
        maximum: 50,
        minimum: 1,
        type: "number",
      },
      offset: {
        format: "int32",
        minimum: 0,
        type: "number",
      },
      total: { format: "int32", minimum: 0, type: "number" },
    },
    required: ["limit", "offset", "total"],
    type: "object",
  };

  const expectedOpenApiComponents = {
    schemas: {
      Pagination: expectedPaginationSchema,
      PaginationInput: expectedPaginationSchema,
    },
  };

  const expectedGetTestPath = {
    get: {
      parameters: [
        {
          description: "A string filter",
          in: "query",
          name: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          description: "Maximum number of items returned",
          in: "query",
          name: "limit",
          required: true,
          schema: { format: "int32", maximum: 50, minimum: 1, type: "number" },
        },
        {
          description: "Pagination starting position",
          in: "query",
          name: "offset",
          required: true,
          schema: { format: "int32", minimum: 0, type: "number" },
        },
      ],
      responses: {
        "200": {
          content: {
            "application/json": {
              schema: {
                allOf: [
                  {
                    additionalProperties: false,
                    properties: {
                      results: {
                        description: "The response results",
                        items: { type: "string" },
                        type: "array",
                      },
                    },
                    required: ["results"],
                    type: "object",
                  },
                  {
                    $ref: "#/components/schemas/Pagination",
                  },
                ],
                description: "Results retrieved successfully",
              },
            },
          },
          description: "Results retrieved successfully",
        },
      },
    },
  };

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
        "/test": expectedGetTestPath,
      },
    });
  });
});
