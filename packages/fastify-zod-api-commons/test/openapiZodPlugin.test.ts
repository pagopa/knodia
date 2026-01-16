import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { OpenAPIV3_1 } from "openapi-types";

import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import openapiZodPlugin from "../src/utils/openapiZodPlugin.ts";

describe("openapiZodPlugin", () => {
  const fastify = Fastify({
    logger: false,
  });

  const testRoute: FastifyPluginAsyncZod = async (fastify) => {
    fastify.route({
      handler: (req, res) => {
        res.send({
          response: `params: ${req.query.param1}, ${req.query.param2}`,
        });
      },
      method: "GET",
      schema: {
        querystring: z.object({
          param1: z.string().describe("A string parameter"),
          param2: z.number().describe("A number parameter"),
        }),
        response: {
          200: z
            .object({
              response: z.string().describe("The response payload"),
            })
            .meta({ id: "TestResponse" }),
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
    expect(openapi.openapi).toBe("3.0.4");
    expect(openapi.info.title).toBe("Test API");
    expect(openapi.info.version).toBe("1.0.0");
    expect(openapi.info.description).toBe("API for testing openapiZodPlugin");

    const testPath = openapi.paths?.["/test"]?.get;
    expect(testPath).toBeDefined();
    expect(testPath?.parameters?.[0]).toMatchObject({
      description: "A string parameter",
      in: "query",
      name: "param1",
      schema: { type: "string" },
    });
    expect(testPath?.parameters?.[1]).toMatchObject({
      description: "A number parameter",
      in: "query",
      name: "param2",
      schema: { type: "number" },
    });
    expect(testPath?.responses["200"]).toMatchObject({
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/TestResponse" },
        },
      },
    });

    expect(openapi.components?.schemas?.["TestResponse"]).toMatchObject({
      properties: {
        response: {
          description: "The response payload",
          type: "string",
        },
      },
      required: ["response"],
      type: "object",
    });
  });
});
