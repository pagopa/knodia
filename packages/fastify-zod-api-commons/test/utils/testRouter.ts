import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
  API_Pagination,
  API_PaginationQueryParams,
} from "@knodia/common-models/api";
import z from "zod";

import { API_Problem } from "../../src/models/api.ts";
import { KnodiaServiceHeaders } from "../../src/models/index.ts";

export const testTags = {
  test: "test",
} as const;

export const testRouter: FastifyPluginAsyncZod = async (fastify) => {
  const API_Test = z
    .strictObject({
      test: z.string(),
    })
    .meta({ id: "Test" });

  const API_Tests = z
    .strictObject({
      results: z.array(API_Test),
    })
    .and(API_Pagination)
    .meta({ id: "Tests" });

  fastify.route({
    handler: (req, res) => {
      res.send({
        limit: req.query.limit,
        offset: req.query.offset,
        results: [{ test: "test1" }, { test: "test2" }],
        total: 2,
      });
    },
    method: "GET",
    schema: {
      description: "Test GET endpoint",
      headers: KnodiaServiceHeaders,
      operationId: "getTest",
      querystring: z
        .strictObject({
          query: z.string().meta({ description: "A string filter" }),
        })
        .and(API_PaginationQueryParams),
      response: {
        200: API_Tests.meta({ description: "Results retrieved successfully" }),
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      responseHeaders: z.object({
        "X-Test-Route-Level": z
          .string()
          .meta({ description: "Route-level response header" }),
      }),
      tags: [testTags.test],
    },
    url: "/test",
  });

  fastify.route({
    handler: (req, res) => {
      res.send({
        test: req.body.test,
      });
    },
    method: "POST",
    schema: {
      body: API_Test,
      description: "Test POST endpoint",
      headers: KnodiaServiceHeaders,
      operationId: "createTest",
      response: {
        201: {
          headers: z.object({
            "X-Test-Response-Level": z
              .string()
              .meta({ description: "Per-response response header" }),
          }),
          properties: API_Test.meta({
            description: "Resource created successfully",
          }),
        },
        400: API_Problem.meta({ description: "Bad Request" }),
        401: API_Problem.meta({ description: "Unauthorized" }),
        403: API_Problem.meta({ description: "Forbidden" }),
      },
      tags: [testTags.test],
    },
    url: "/test",
  });

  fastify.route({
    handler: (_req, res) => {
      res.send({ test: "ok" });
    },
    method: "POST",
    schema: {
      cookies: z.object({
        session: z
          .string()
          .optional()
          .meta({ description: "HttpOnly session cookie" }),
      }),
      description: "Test endpoint with cookie parameter",
      operationId: "testCookie",
      response: {
        200: API_Test.meta({ description: "OK" }),
      },
      tags: [testTags.test],
    },
    url: "/test/cookie",
  });
};
