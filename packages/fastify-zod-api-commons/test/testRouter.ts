import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import z from "zod";

import {
  API_Pagination,
  API_PaginationQueryParams,
} from "../src/models/api.ts";

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
      operationId: "getTest",
      querystring: z
        .strictObject({
          query: z.string().describe("A string filter"),
        })
        .and(API_PaginationQueryParams),
      response: {
        200: API_Tests.describe("Results retrieved successfully"),
      },
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
      operationId: "createTest",
      response: {
        201: API_Test.describe("Resource created successfully"),
      },
      tags: [testTags.test],
    },
    url: "/test",
  });
};
