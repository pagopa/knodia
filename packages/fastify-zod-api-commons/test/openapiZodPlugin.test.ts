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
            .describe("TestResponse"),
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

  it("exposes an OpenAPI 3.0.4 spec for registered routes", () => {
    const openapi = fastify.swagger() as OpenAPIV3_1.Document;
    expect(openapi).toBe({
      info: {
        description: "API for testing openapiZodPlugin",
        title: "Test API",
        version: "1.0.0",
      },
      openapi: "3.0.4",
      paths: {
        "/test": {
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
                schema: { type: "number" },
              },
              {
                description: "Pagination starting position",
                in: "query",
                name: "offset",
                required: true,
                schema: { type: "number" },
              },
            ],
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/TestResponse" },
                  },
                },
                description: "TestResponse",
              },
            },
          },
        },
      },
    });
    // expect(openapi.openapi).toBe("3.0.4");
    // expect(openapi.info.title).toBe("Test API");
    // expect(openapi.info.version).toBe("1.0.0");
    // expect(openapi.info.description).toBe("API for testing openapiZodPlugin");

    // // const testPath = openapi.paths?.["/test"]?.get;
    // // expect(testPath).toBeDefined();
    // // const parameters = testPath?.parameters ?? [];
    // // const parametersByName = Object.fromEntries(
    // //   parameters.map((parameter) => [
    // //     (parameter as OpenAPIV3_1.ParameterObject).name,
    // //     parameter,
    // //   ]),
    // // );
    // // expect(parametersByName.param1).toMatchObject({
    // //   description: "A string parameter",
    // //   in: "query",
    // //   name: "param1",
    // //   schema: { type: "string" },
    // // });
    // // expect(parametersByName.param2).toMatchObject({
    // //   description: "A number parameter",
    // //   in: "query",
    // //   name: "param2",
    // //   schema: { type: "number" },
    // // });
    // // expect(parametersByName.limit).toMatchObject({
    // //   description: "Maximum number of items returned",
    // //   in: "query",
    // //   name: "limit",
    // // });
    // // expect(parametersByName.offset).toMatchObject({
    // //   description: "Pagination starting position",
    // //   in: "query",
    // //   name: "offset",
    // // });
    // expect(testPath?.responses["200"]).toMatchObject({
    //   content: {
    //     "application/json": {
    //       schema: { $ref: "#/components/schemas/TestResponse" },
    //     },
    //   },
    // });

    // expect(openapi.components?.schemas?.["TestResponse"]).toMatchObject({
    //   properties: {
    //     results: {
    //       description: "The response results",
    //       type: "array",
    //       items: { type: "string" },
    //     },
    //     limit: expect.any(Object),
    //     offset: expect.any(Object),
    //     total: expect.any(Object),
    //   },
    //   required: ["results", "limit", "offset", "total"],
    //   type: "object",
    // });
  });
});
