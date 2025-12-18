import Fastify from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { z } from "zod";
import openapiZodPlugin from "../src/openapiZodPlugin.ts";
import type { OpenAPIV3_1 } from "openapi-types";

describe("openapiZodPlugin", () => {
  const fastify = Fastify({
    logger: false,
  });

  const testRoute: FastifyPluginAsyncZod = async (fastify) => {
    fastify.route({
      method: "GET",
      url: "/test",
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
      handler: (req, res) => {
        res.send({
          response: `params: ${req.query.param1}, ${req.query.param2}`,
        });
      },
    });
  };

  beforeAll(async () => {
    await fastify.register(openapiZodPlugin, {
      openapi: {
        info: {
          title: "Test API",
          description: "API for testing openapiZodPlugin",
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

  it("exposes an OpenAPI 3.1 spec for registered routes", () => {
    const openapi = fastify.swagger() as OpenAPIV3_1.Document;
    expect(openapi.openapi).toBe("3.1.2");
    expect(openapi.info.title).toBe("Test API");
    expect(openapi.info.version).toBe("1.0.0");
    expect(openapi.info.description).toBe("API for testing openapiZodPlugin");

    const testPath = openapi.paths?.["/test"]?.get;
    expect(testPath).toBeDefined();
    expect(testPath?.parameters?.[0]).toMatchObject({
      name: "param1",
      in: "query",
      schema: { type: "string" },
      description: "A string parameter",
    });
    expect(testPath?.parameters?.[1]).toMatchObject({
      name: "param2",
      in: "query",
      schema: { type: "number" },
      description: "A number parameter",
    });
    expect(testPath?.responses["200"]).toMatchObject({
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/TestResponse" },
        },
      },
    });

    expect(openapi.components?.schemas?.["TestResponse"]).toMatchObject({
      type: "object",
      properties: {
        response: {
          type: "string",
          description: "The response payload",
        },
      },
      required: ["response"],
    });
  });

  it("excludes zod *Input schemas from the OpenAPI spec", () => {
    const openapi = fastify.swagger() as OpenAPIV3_1.Document;
    const schemas = openapi.components?.schemas ?? {};

    expect(schemas["TestResponse"]).toBeDefined();
    expect(schemas["TestResponseInput"]).toBeUndefined();
  });
});
